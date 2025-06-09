pub mod auth;
pub mod user;
pub mod message;
pub mod friend;
pub mod group;
pub mod file;
pub mod websocket;

use crate::{config::Config, database::Database};
use anyhow::Result;
use redis::Client as RedisClient;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppServices {
    pub auth: auth::AuthService,
    pub user: user::UserService,
    pub message: message::MessageService,
    pub friend: friend::FriendService,
    pub group: group::GroupService,
    pub file: file::FileService,
    pub websocket: websocket::WebSocketService,
}

impl AppServices {
    pub async fn new(db: Database, config: &Config) -> Result<Self> {
        let redis_client = RedisClient::open(config.redis_url.as_str())?;
        
        let auth = auth::AuthService::new(db.clone(), config.jwt_secret.clone());
        let user = user::UserService::new(db.clone());
        let message = message::MessageService::new(db.clone());
        let friend = friend::FriendService::new(db.clone());
        let group = group::GroupService::new(db.clone());
        let file = file::FileService::new(db.clone(), config.upload_dir.clone());
        let websocket = websocket::WebSocketService::new(redis_client);

        Ok(AppServices {
            auth,
            user,
            message,
            friend,
            group,
            file,
            websocket,
        })
    }
}
