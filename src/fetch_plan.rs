use serde::{Deserialize, Serialize};

use crate::preflight::{evaluate, PreflightRequest};
use crate::{normalize_repo, CANONICAL_GOVERNANCE_REPO, SOVEREIGN_ORG, TARGET_FORGE};

#[derive(Debug, Clone, Deserialize)]
pub struct FetchPlanRequest {
    pub active_org: String,
    pub token_org: String,
    pub repo: String,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct FetchPlan {
    pub blocked: bool,
    pub reason: String,
    pub target_forge: String,
    pub commands: Vec<String>,
    pub notes: Vec<String>,
}

pub fn plan(request: &FetchPlanRequest) -> FetchPlan {
    let preflight = evaluate(&PreflightRequest {
        active_org: request.active_org.clone(),
        token_org: request.token_org.clone(),
        repo: request.repo.clone(),
        cwd: request.cwd.clone(),
    });

    let repo = if request.repo.trim().is_empty() {
        CANONICAL_GOVERNANCE_REPO.to_string()
    } else {
        let normalized = normalize_repo(&request.repo);
        if normalized == "code-governance" {
            CANONICAL_GOVERNANCE_REPO.to_string()
        } else {
            normalized
        }
    };

    let cwd = if request.cwd.trim().is_empty() {
        "~/engineering/code-governance".to_string()
    } else {
        request.cwd.trim().to_string()
    };

    let commands = vec![
        format!("aivcs org switch {SOVEREIGN_ORG}"),
        "aivcs whoami".to_string(),
        format!("mkdir -p {cwd}"),
        format!("cd {cwd}"),
        format!("aivcs fetch --repo {repo}"),
    ];

    let mut notes = vec![
        format!("Active Org must show `{SOVEREIGN_ORG}`."),
        format!("Target Forge must show `{TARGET_FORGE}`."),
        "Never run `aivcs fetch` in ~/engineering or another workspace root.".to_string(),
        "A materialized snapshot may already exist at ~/engineering/code-governance-publish-base.".to_string(),
    ];

    if preflight.ok {
        notes.insert(0, "Preflight passed. These commands are safe to run in order.".to_string());
    } else {
        notes.insert(
            0,
            "Preflight failed. The commands below are the recovery sequence, not a go-ahead to fetch from the current context.".to_string(),
        );
    }

    FetchPlan {
        blocked: !preflight.ok,
        reason: preflight.verdict,
        target_forge: TARGET_FORGE.into(),
        commands,
        notes,
    }
}
