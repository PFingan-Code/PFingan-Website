export interface GitHubClientOptions {
  owner: string;
  repo: string;
  token: string;
}

export interface GitHubReference {
  ref: string;
  sha: string;
}

export interface GitHubFile {
  path: string;
  sha: string;
  content: string;
}

export interface GitHubWorkflowRun {
  id: number;
  html_url: string;
  status: string;
  conclusion: string | null;
  created_at: string;
}

export class GitHubApiError extends Error {
  readonly status: number;
  readonly kind: 'auth' | 'rate-limit' | 'conflict' | 'not-found' | 'request';
  readonly retryAfter?: string;

  constructor(status: number, kind: GitHubApiError['kind'], message: string, retryAfter?: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

function classifyError(status: number): GitHubApiError['kind'] {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'not-found';
  if (status === 409 || status === 422) return 'conflict';
  if (status === 429) return 'rate-limit';
  return 'request';
}

function safeMessage(status: number, body: unknown): string {
  if (status === 401) return 'GitHub Token 无效或已过期';
  if (status === 403) return 'GitHub 拒绝了请求，请检查 Token 权限或 API 限流状态';
  if (status === 404) return 'GitHub 资源不存在，可能是仓库、分支或 workflow 配置错误';
  if (status === 409 || status === 422) return 'GitHub 检测到版本冲突或请求参数无效';
  if (status === 429) return 'GitHub API 已限流，请稍后重试';
  const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string' ? body.message : '';
  return message ? `GitHub 请求失败：${message.slice(0, 180)}` : `GitHub 请求失败（${status}）`;
}

export class GitHubClient {
  private readonly baseUrl = 'https://api.github.com';
  private readonly owner: string;
  private readonly repo: string;
  private readonly token: string;

  constructor(options: GitHubClientOptions) {
    this.owner = options.owner;
    this.repo = options.repo;
    this.token = options.token.trim();
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? {'Content-Type': 'application/json'} : {}),
        ...init.headers,
      },
    });
    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      throw new GitHubApiError(response.status, classifyError(response.status), safeMessage(response.status, body), response.headers.get('retry-after') ?? undefined);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  async verifyAccess(): Promise<{login: string; permissions?: Record<string, string>}> {
    return this.request('/user');
  }

  async getReference(branch: string): Promise<GitHubReference> {
    const result = await this.request<{ref: string; object: {sha: string}}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/ref/heads/${encodeURIComponent(branch)}`);
    return {ref: result.ref, sha: result.object.sha};
  }

  async getCommit(commitSha: string): Promise<{treeSha: string}> {
    const result = await this.request<{tree: {sha: string}}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/commits/${encodeURIComponent(commitSha)}`);
    return {treeSha: result.tree.sha};
  }

  async getFile(path: string, branch: string): Promise<GitHubFile> {
    const result = await this.request<{path: string; sha: string; content: string; encoding: string}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`);
    if (result.encoding !== 'base64') throw new GitHubApiError(200, 'request', 'GitHub 返回了不支持的文件编码');
    const content = decodeBase64(result.content.replace(/\s/g, ''));
    return {path: result.path, sha: result.sha, content};
  }

  async createBlob(content: string): Promise<string> {
    const result = await this.request<{sha: string}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({content, encoding: 'utf-8'}),
    });
    return result.sha;
  }

  async createTree(baseTreeSha: string, entries: Array<{path: string; sha: string}>): Promise<string> {
    const result = await this.request<{sha: string}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({base_tree: baseTreeSha, tree: entries.map((entry) => ({path: entry.path, mode: '100644', type: 'blob', sha: entry.sha}))}),
    });
    return result.sha;
  }

  async createCommit(message: string, treeSha: string, parentSha: string): Promise<string> {
    const result = await this.request<{sha: string}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({message, tree: treeSha, parents: [parentSha]}),
    });
    return result.sha;
  }

  async updateReference(branch: string, sha: string): Promise<void> {
    await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({sha, force: false}),
    });
  }

  async dispatchWorkflow(workflow: string, ref: string, inputs: Record<string, string> = {}): Promise<void> {
    if (workflow !== 'deploy.yml') throw new GitHubApiError(400, 'request', '仅允许触发 deploy.yml');
    await this.request(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ref, inputs}),
    });
  }

  async getLatestWorkflowRun(workflow: string, branch: string, createdAfter?: string): Promise<GitHubWorkflowRun | undefined> {
    if (workflow !== 'deploy.yml') throw new GitHubApiError(400, 'request', '仅允许查询 deploy.yml');
    const createdQuery = createdAfter ? `&created=${encodeURIComponent(`>=${createdAfter}`)}` : '';
    const result = await this.request<{workflow_runs: GitHubWorkflowRun[]}>(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/actions/workflows/${workflow}/runs?branch=${encodeURIComponent(branch)}&per_page=1${createdQuery}`);
    return result.workflow_runs[0];
  }
}

function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
