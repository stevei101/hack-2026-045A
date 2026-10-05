use serde::{Deserialize, Serialize};

use crate::{normalize_org, normalize_repo, CANONICAL_GOVERNANCE_REPO, SOVEREIGN_ORG, TARGET_FORGE};

const DEPRECATED_ORGS: &[&str] = &["lornu-ai", "lornuai", "lornu"];

#[derive(Debug, Clone, Deserialize)]
pub struct PreflightRequest {
    pub active_org: String,
    pub token_org: String,
    pub repo: String,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Pass,
    Warn,
    Fail,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct Finding {
    pub code: String,
    pub severity: Severity,
    pub title: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct PreflightReport {
    pub ok: bool,
    pub verdict: String,
    pub http_risk: Option<String>,
    pub sovereign_org: String,
    pub target_forge: String,
    pub findings: Vec<Finding>,
}

pub fn evaluate(request: &PreflightRequest) -> PreflightReport {
    let active = normalize_org(&request.active_org);
    let token = normalize_org(&request.token_org);
    let repo = normalize_repo(&request.repo);
    let cwd = request.cwd.trim();

    let mut findings = Vec::new();

    if active.is_empty() {
        findings.push(Finding {
            code: "active_org_missing".into(),
            severity: Severity::Fail,
            title: "Active organization is empty".into(),
            detail: "Run `aivcs org switch aivcs` and confirm with `aivcs whoami`.".into(),
        });
    } else if is_deprecated(&active) {
        findings.push(Finding {
            code: "deprecated_active_org".into(),
            severity: Severity::Fail,
            title: format!("`{active}` is a retired namespace"),
            detail: format!(
                "All production repositories were consolidated under `{SOVEREIGN_ORG}`. Switching here is the usual cause of a 401."
            ),
        });
    } else if active != SOVEREIGN_ORG {
        findings.push(Finding {
            code: "active_org_not_sovereign".into(),
            severity: Severity::Fail,
            title: format!("Active org `{active}` is not `{SOVEREIGN_ORG}`"),
            detail: format!("Expected `{SOVEREIGN_ORG}`. Use `aivcs org switch {SOVEREIGN_ORG}`."),
        });
    } else {
        findings.push(Finding {
            code: "active_org_ok".into(),
            severity: Severity::Pass,
            title: format!("Active org is `{SOVEREIGN_ORG}`"),
            detail: "Sovereign namespace is selected.".into(),
        });
    }

    if token.is_empty() {
        findings.push(Finding {
            code: "token_org_missing".into(),
            severity: Severity::Fail,
            title: "Token organization is empty".into(),
            detail: "The access token in `~/.aivcs/credentials.json` must declare `org_name: aivcs`.".into(),
        });
    } else if token != SOVEREIGN_ORG {
        findings.push(Finding {
            code: "token_org_not_sovereign".into(),
            severity: Severity::Fail,
            title: format!("Token is scoped to `{token}`"),
            detail: format!(
                "A token for `{token}` cannot authorize `{SOVEREIGN_ORG}` repositories. Re-issue credentials for `{SOVEREIGN_ORG}`."
            ),
        });
    } else {
        findings.push(Finding {
            code: "token_org_ok".into(),
            severity: Severity::Pass,
            title: format!("Token is scoped to `{SOVEREIGN_ORG}`"),
            detail: "Credential org matches the sovereign namespace.".into(),
        });
    }

    if !active.is_empty() && !token.is_empty() && active != token {
        findings.push(Finding {
            code: "org_token_mismatch".into(),
            severity: Severity::Fail,
            title: "Active org and token org do not match".into(),
            detail: format!(
                "`active_org={active}` but the token is scoped to `{token}`. Querying `{active}/code-governance` returns HTTP 401 Unauthorized."
            ),
        });
    }

    if repo.is_empty() {
        findings.push(Finding {
            code: "repo_missing".into(),
            severity: Severity::Fail,
            title: "Repository is empty".into(),
            detail: format!("Use `{CANONICAL_GOVERNANCE_REPO}`."),
        });
    } else if looks_like_typo(&repo) {
        findings.push(Finding {
            code: "repo_typo".into(),
            severity: Severity::Fail,
            title: format!("`{repo}` looks misspelled"),
            detail: format!("The catalog repository is `{CANONICAL_GOVERNANCE_REPO}` (not `code-govnernance`)."),
        });
    } else if !repo_is_governance(&repo) {
        findings.push(Finding {
            code: "repo_unexpected".into(),
            severity: Severity::Warn,
            title: format!("`{repo}` is not the governance catalog"),
            detail: format!("Canonical checkout is `{CANONICAL_GOVERNANCE_REPO}`."),
        });
    } else {
        findings.push(Finding {
            code: "repo_ok".into(),
            severity: Severity::Pass,
            title: format!("Repository resolves to `{CANONICAL_GOVERNANCE_REPO}`"),
            detail: "Name spelling and org prefix are valid.".into(),
        });
    }

    if cwd.is_empty() {
        findings.push(Finding {
            code: "cwd_missing".into(),
            severity: Severity::Fail,
            title: "Checkout directory is empty".into(),
            detail: "`aivcs fetch` writes into `.`. Create a dedicated directory first.".into(),
        });
    } else if is_unsafe_cwd(cwd) {
        findings.push(Finding {
            code: "cwd_unsafe".into(),
            severity: Severity::Fail,
            title: "Fetch directory is a workspace root".into(),
            detail: format!(
                "`aivcs fetch` materializes files into the current directory. `{cwd}` looks like a workspace root (the harbormaster unpack). Use a dedicated folder such as `~/engineering/code-governance`."
            ),
        });
    } else {
        findings.push(Finding {
            code: "cwd_ok".into(),
            severity: Severity::Pass,
            title: "Dedicated checkout directory".into(),
            detail: format!("Fetch will unpack into `{cwd}`."),
        });
    }

    let failed = findings.iter().any(|f| f.severity == Severity::Fail);
    let http_risk = if findings.iter().any(|f| f.code == "org_token_mismatch" || f.code == "deprecated_active_org")
    {
        Some("HTTP 401 Unauthorized".into())
    } else {
        None
    };

    PreflightReport {
        ok: !failed,
        verdict: if failed {
            "Blocked — fix the failing checks before fetch.".into()
        } else {
            "Clear to fetch under the sovereign aivcs org.".into()
        },
        http_risk,
        sovereign_org: SOVEREIGN_ORG.into(),
        target_forge: TARGET_FORGE.into(),
        findings,
    }
}

fn is_deprecated(org: &str) -> bool {
    DEPRECATED_ORGS.contains(&org)
}

fn looks_like_typo(repo: &str) -> bool {
    let name = repo.rsplit('/').next().unwrap_or(repo);
    if name == "code-governance" {
        return false;
    }
    name.contains("govnernance") || name.contains("goverance") || name.contains("code-gov")
}

fn repo_is_governance(repo: &str) -> bool {
    repo == CANONICAL_GOVERNANCE_REPO || repo == "code-governance"
}

pub fn is_unsafe_cwd(cwd: &str) -> bool {
    let trimmed = cwd.trim_end_matches('/');
    let name = trimmed.rsplit('/').next().unwrap_or(trimmed);
    matches!(
        name,
        "engineering" | "src" | "workspace" | "repos" | "code" | "home" | "Desktop" | "Documents"
    ) || trimmed == "~"
        || trimmed == "/"
        || trimmed == "."
}
