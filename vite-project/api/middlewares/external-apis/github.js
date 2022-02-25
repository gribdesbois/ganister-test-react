const { Octokit } = require('@octokit/rest');
const config = require('../../../config/config');

const octokit = new Octokit({ auth: config.githubToken });

/**
 * Get Github User
 *
 * @return {Object} User Object.
 */
const getUser = async () => {
  try {
    const { data } = await octokit.request('/user');
    return { data };
  } catch (err) {
    return { error: err.message };
  }
};

/* ************************************************ */
/* ******************** ISSUES ******************** */
/* ************************************************ */

/**
 * List issues assigned to the authenticated user
 *
 * List issues assigned to the authenticated user across all visible repositories including owned repositories, member repositories, and organization repositories. You can use the filter query parameter to fetc issues that are not necessarily assigned to you
 *
 * Note: GitHub's REST API v3 considers every pull request an issue, but not every issue is a pull request. For this reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by the pull_request key.
 *
 * Be aware that the id of a pull request returned from "Issues" endpoints will be an issue id. To find out the pull request id, use the "List pull requests" endpoint.
 *
 * @param {Object} [options={}] Option Object: filter, state, labels, sort, direction, since, per_page, page
 *
 * @return {Array} Array of issues.
 */
const getIssues = async (options = {}) => {
  try {
    const { data } = await octokit.issues.list(options);
    return { data };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * List repository issues
 *
 * List issues in a repository.
 *
 * Note: GitHub's REST API v3 considers every pull request an issue, but not every issue is a pull request. For this reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by the pull_request key.
 * Be aware that the id of a pull request returned from "Issues" endpoints will be an issue id. To find out the pull request id, use the "List pull requests" endpoint.
 *
 * @param {string} owner Owner Name
 * @param {string} repo Repository Name
 * @param {Object} [options={}] Option Object: milestone, state, assignee, creator, mentioned, labels, sort, direction, since, per_page, page
 *
 * @return {Array} Array of issues.
 */
const issuesListForRepo = async (owner, repo, options = {}) => {
  const params = { ...options, owner, repo };
  try {
    const { data } = await octokit.issues.listForRepo(params);
    return { data };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Get an issue
 *
 *
 * The API returns a 301 Moved Permanently status if the issue was transferred to another repository. If the issue was transferred to or deleted from a repository where the authenticated user lacks read access, the API returns a 404 Not Found status. If the issue was
 * deleted from a repository where the authenticated user has read access, the API returns a 410 Gone status. To receive webhook events for transferred and deleted issues, subscribe to the issues webhook.
 *
 * Note: GitHub's REST API v3 considers every pull request an issue, but not every issue is a pull request. For this reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by the pull_request key.
 *
 * Be aware that the id of a pull request returned from "Issues" endpoints will be an issue id. To find out the pull request id, use the "List pull requests" endpoint.
 *
 * @param {string} owner Owner Name
 * @param {string} repo Repository Name
 * @param {string} issue_number Issue Number
 *
 * @return {Object} Returns Issue.
 */
const getIssue = async (owner, repo, issueNumber) => {
  try {
    const { data } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
    return { data };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Create an issue
 *
 * Any user with pull access to a repository can create an issue. If issues are disabled in the repository, the API returns a 410 Gone status.
 *
 * @param {string} owner Owner Name
 * @param {string} repo Repository Name
 * @param {string} title The title of the issue
 * @param {string} body The contents of the issue
 * @param {string} assignee Login for the user that this issue should be assigned to
 * @param {number} milestone The number of the milestone to associate this issue with
 * @param {string} labels Labels to associate with this issue
 * @param {string} assignees Logins for Users to assign to this issue
 *
 * @return {Object} Returns Issue.
 */

const createIssue = async (owner, repo, title, body, assignee, milestone, labels, assignees) => {
  try {
    const { data } = await octokit.issues.create({ owner, repo, title });
    return { data };
  } catch (err) {
    return { error: err.message };
  }
};


/* ************************************************ */
/* ******************* COMMITS ******************** */
/* ************************************************ */

const listCommits = async (owner, repo) => {
  const params = { owner, repo };
  try {
    const { data } = await octokit.repos.listCommits(params);
    return { data };
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = {
  createIssue,
  getIssue,
  getIssues,
  getUser,
  issuesListForRepo,
  listCommits,
};