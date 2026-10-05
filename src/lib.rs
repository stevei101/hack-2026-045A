//! Org Guard — sovereign-org preflight for AIVCS checkouts.
//!
//! Production repositories live under `aivcs://aivcs/<repo>`. A token scoped
//! to `aivcs` cannot query a deprecated namespace such as `lornu-ai` and
//! fails with HTTP 401. `aivcs fetch` also unpacks into the current
//! directory, so a checkout must never start in a workspace root.

pub mod catalog;
pub mod fetch_plan;
pub mod preflight;

pub const SOVEREIGN_ORG: &str = "aivcs";
pub const TARGET_FORGE: &str = "https://aivcsd-dokv.aivcs.io";
pub const CANONICAL_GOVERNANCE_REPO: &str = "aivcs/code-governance";

pub fn normalize_org(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

pub fn normalize_repo(value: &str) -> String {
    value.trim().trim_start_matches("aivcs://").trim_matches('/').to_string()
}
