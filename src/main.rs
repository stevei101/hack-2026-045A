use std::net::SocketAddr;
use std::path::PathBuf;

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use org_guard::catalog::catalog;
use org_guard::fetch_plan::{plan, FetchPlanRequest};
use org_guard::preflight::{evaluate, PreflightRequest};
use tokio::net::TcpListener;
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(43173);

    let static_dir = static_dir();
    let app = Router::new()
        .route("/healthz", get(healthz))
        .route("/api/catalog", get(get_catalog))
        .route("/api/preflight", post(post_preflight))
        .route("/api/fetch-plan", post(post_fetch_plan))
        .fallback_service(ServeDir::new(static_dir).append_index_html_on_directories(true))
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("org-guard listening on http://{addr}");
    let listener = TcpListener::bind(addr).await.expect("bind port");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server");
}

async fn healthz() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "org-guard",
        "hack": "2026-045A"
    }))
}

async fn get_catalog() -> impl IntoResponse {
    Json(catalog())
}

async fn post_preflight(Json(request): Json<PreflightRequest>) -> impl IntoResponse {
    (StatusCode::OK, Json(evaluate(&request)))
}

async fn post_fetch_plan(Json(request): Json<FetchPlanRequest>) -> impl IntoResponse {
    (StatusCode::OK, Json(plan(&request)))
}

fn static_dir() -> PathBuf {
    let candidates = [
        PathBuf::from("static"),
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("static"),
    ];
    candidates
        .into_iter()
        .find(|path| path.exists())
        .unwrap_or_else(|| PathBuf::from("static"))
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}
