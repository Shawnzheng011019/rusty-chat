use axum::{
    extract::{ws::WebSocketUpgrade, State},
    middleware,
    response::Response,
    routing::{get, post},
    Router,
};
use tower_http::{cors::CorsLayer, services::ServeDir};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod database;
mod handlers;
mod models;
mod services;
mod websocket;

use config::Config;
use database::Database;
use services::AppServices;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub services: AppServices,
    pub config: Config,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "rusty_chat=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenvy::dotenv().ok();

    let config = Config::from_env()?;
    let db = Database::new(&config.database_url).await?;
    let services = AppServices::new(db.clone(), &config).await?;

    let state = AppState {
        db,
        services,
        config: config.clone(),
    };

    let app = create_router(state);

    let listener = tokio::net::TcpListener::bind(&config.server_addr).await?;
    tracing::info!("Server running on {}", config.server_addr);

    axum::serve(listener, app).await?;

    Ok(())
}

fn create_router(state: AppState) -> Router {
    // Public routes (no auth required)
    let public_routes = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/refresh", post(handlers::auth::refresh_token))
        .route("/api/files/:id", get(handlers::files::download_file));

    // Protected routes (auth required)
    let protected_routes = Router::new()
        .route("/api/users/me", get(handlers::users::get_current_user))
        .route("/api/users/search", get(handlers::users::search_users))
        .route("/api/friends", get(handlers::friends::get_friends))
        .route("/api/friends/requests", post(handlers::friends::send_friend_request))
        .route("/api/friends/requests/:id/accept", post(handlers::friends::accept_friend_request))
        .route("/api/friends/requests/:id/reject", post(handlers::friends::reject_friend_request))
        .route("/api/friends/:id", axum::routing::delete(handlers::friends::remove_friend))
        .route("/api/groups", get(handlers::groups::get_groups))
        .route("/api/groups", post(handlers::groups::create_group))
        .route("/api/groups/:id/members", post(handlers::groups::add_member))
        .route("/api/groups/:id/members/:user_id", axum::routing::delete(handlers::groups::remove_member))
        .route("/api/groups/:id/members", get(handlers::groups::get_group_members))
        .route("/api/messages/:chat_id", get(handlers::messages::get_messages))
        .route("/api/upload", post(handlers::files::upload_file))
        .layer(middleware::from_fn_with_state(state.clone(), handlers::auth_middleware));

    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .route("/ws", get(websocket_handler))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .nest_service("/", ServeDir::new("frontend/dist"))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> impl axum::response::IntoResponse {
    axum::Json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now(),
        "service": "rusty-chat"
    }))
}

async fn websocket_handler(
    State(state): State<AppState>,
    ws: WebSocketUpgrade,
) -> Response {
    ws.on_upgrade(|socket| websocket::handle_socket(socket, state))
}
