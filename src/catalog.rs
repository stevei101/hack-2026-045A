use serde::Serialize;

use crate::{CANONICAL_GOVERNANCE_REPO, SOVEREIGN_ORG, TARGET_FORGE};

#[derive(Debug, Clone, Serialize)]
pub struct Policy {
    pub id: String,
    pub title: String,
    pub status: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Incident {
    pub id: String,
    pub title: String,
    pub trigger: String,
    pub effect: String,
    pub fix: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Catalog {
    pub org: String,
    pub repo: String,
    pub forge: String,
    pub policies: Vec<Policy>,
    pub incident: Incident,
}

pub fn catalog() -> Catalog {
    Catalog {
        org: SOVEREIGN_ORG.into(),
        repo: CANONICAL_GOVERNANCE_REPO.into(),
        forge: TARGET_FORGE.into(),
        policies: vec![
            Policy {
                id: "single-org-standard".into(),
                title: "Single organization standard".into(),
                status: "required".into(),
                summary: format!(
                    "Production repositories live at aivcs://{SOVEREIGN_ORG}/<repo>. The lornu-ai namespace is obsolete and must not be the active org."
                ),
            },
            Policy {
                id: "token-org-alignment".into(),
                title: "Token and org alignment".into(),
                status: "required".into(),
                summary: "The issued access token org_name must match active_org. A mismatch on code-governance is HTTP 401 Unauthorized.".into(),
            },
            Policy {
                id: "directory-isolation".into(),
                title: "Fetch directory isolation".into(),
                status: "required".into(),
                summary: "aivcs fetch unpacks into the current directory. Always mkdir a dedicated worktree before fetch. Never run it in ~/engineering.".into(),
            },
            Policy {
                id: "canonical-name".into(),
                title: "Canonical repository name".into(),
                status: "required".into(),
                summary: format!(
                    "The governance catalog is `{CANONICAL_GOVERNANCE_REPO}`. Watch the spelling: code-governance, not code-govnernance."
                ),
            },
        ],
        incident: Incident {
            id: "lornu-ai-401".into(),
            title: "Deprecated org switch caused 401".into(),
            trigger: "aivcs org switch lornu-ai updated ~/.aivcs/config.json while credentials stayed scoped to aivcs.".into(),
            effect: "Queries for code-governance under lornu-ai failed with HTTP 401 Unauthorized.".into(),
            fix: format!("aivcs org switch {SOVEREIGN_ORG}, confirm whoami, then fetch from a dedicated directory."),
        },
    }
}
