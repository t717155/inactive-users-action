module.exports = class Organization {

  constructor(octokit) {
    if (!octokit) {
      throw new Error('An octokit client must be provided');
    }
    this._octokit = octokit;
  }

  // getRepositories(org) {
  //   return this.octokit.paginate("GET /orgs/:org/repos", {org: org, per_page: 100})
  //     .then(repos => {
  //       console.log(`Processing ${repos.length} repositories`);
  //       return repos.map(repo => { return {
  //         name: repo.name,
  //         owner: org, //TODO verify this in not in the payload
  //         full_name: repo.full_name,
  //         has_issues: repo.has_issues,
  //         has_projects: repo.has_projects,
  //         url: repo.html_url,
  //       }});
  //     });
  // }
  async getRepositories(org) {
  try {
    const repos = await this.octokit.paginate("GET /orgs/:org/repos", {
      org: org, 
      per_page: 100
    });
    
    // Handle empty response (204 No Content)
    if (!repos || repos.length === 0) {
      console.log(`No repositories found for organization: ${org}`);
      return [];
    }
    
    console.log(`Processing ${repos.length} repositories`);
    
    // Check each repository's contents and filter out 404s
    const validRepos = [];
    
    for (const repo of repos) {
      console.log(`Processing ${repo}`)
      try {
        // Check if repository contents are accessible
        await this.octokit.request('GET /repos/{owner}/{repo}/contents', {
          owner: org,
          repo: repo.name
        });
        
        // If successful, add to valid repos list
        validRepos.push({
          name: repo.name,
          owner: org,
          full_name: repo.full_name,
          has_issues: repo.has_issues,
          has_projects: repo.has_projects,
          url: repo.html_url,
        });
        
      } catch (error) {
        // Skip repos that return 404 or are inaccessible
        if (error.status === 404) {
          console.log(`Skipping ${repo.full_name}: contents not accessible (404)`);
        } else {
          console.warn(`Error checking ${repo.full_name}: ${error.message}`);
        }
      }
    }
    
    console.log(`${validRepos.length} out of ${repos.length} repositories have accessible contents`);
    return validRepos;
    
  } catch (error) {
    // Handle 204 status code and other errors
    if (error.status === 204) {
      console.log(`No repositories found for organization: ${org} (204 No Content)`);
      return [];
    }
    throw error;
  }
}


  findUsers(org) {
    return this.octokit.paginate("GET /orgs/:org/members", {org: org, per_page: 100})
      .then(members => {
        return members.map(member => {
          return {
            login: member.login,
            email: member.email || ''
          };
        });
      });
  }

  get octokit() {
    return this._octokit;
  }
}
