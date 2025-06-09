use crate::models::{MessageResponse, TypingIndicator, WebSocketMessage};
use anyhow::Result;
use redis::{Client as RedisClient, Commands};
use serde_json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

pub type UserSender = broadcast::Sender<String>;
pub type UserReceiver = broadcast::Receiver<String>;

#[derive(Clone)]
pub struct WebSocketService {
    redis_client: RedisClient,
    connections: Arc<RwLock<HashMap<Uuid, UserSender>>>,
}

impl WebSocketService {
    pub fn new(redis_client: RedisClient) -> Self {
        Self {
            redis_client,
            connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_connection(&self, user_id: Uuid) -> UserReceiver {
        let (tx, rx) = broadcast::channel(100);
        
        let mut connections = self.connections.write().await;
        connections.insert(user_id, tx);
        
        rx
    }

    pub async fn remove_connection(&self, user_id: Uuid) {
        let mut connections = self.connections.write().await;
        connections.remove(&user_id);
    }

    pub async fn send_to_user(&self, user_id: Uuid, message: &str) -> Result<()> {
        let connections = self.connections.read().await;
        
        if let Some(sender) = connections.get(&user_id) {
            let _ = sender.send(message.to_string());
        }
        
        Ok(())
    }

    pub async fn broadcast_message(&self, message: &MessageResponse, chat_participants: &[Uuid]) -> Result<()> {
        let ws_message = WebSocketMessage {
            message_type: "new_message".to_string(),
            data: serde_json::to_value(message)?,
        };
        
        let message_str = serde_json::to_string(&ws_message)?;
        
        for &user_id in chat_participants {
            let _ = self.send_to_user(user_id, &message_str).await;
        }
        
        Ok(())
    }

    pub async fn broadcast_typing(&self, typing: &TypingIndicator, chat_participants: &[Uuid]) -> Result<()> {
        let ws_message = WebSocketMessage {
            message_type: "typing".to_string(),
            data: serde_json::to_value(typing)?,
        };
        
        let message_str = serde_json::to_string(&ws_message)?;
        
        for &user_id in chat_participants {
            if user_id != typing.user_id {
                let _ = self.send_to_user(user_id, &message_str).await;
            }
        }
        
        Ok(())
    }

    pub async fn broadcast_user_status(&self, user_id: Uuid, is_online: bool) -> Result<()> {
        let status_message = WebSocketMessage {
            message_type: "user_status".to_string(),
            data: serde_json::json!({
                "user_id": user_id,
                "is_online": is_online
            }),
        };
        
        let message_str = serde_json::to_string(&status_message)?;
        
        // Get user's friends and group members to notify
        let mut redis_conn = self.redis_client.get_connection()?;
        let friends_key = format!("user:{}:friends", user_id);
        let friends: Vec<String> = redis_conn.smembers(&friends_key)?;
        
        for friend_id_str in friends {
            if let Ok(friend_id) = Uuid::parse_str(&friend_id_str) {
                let _ = self.send_to_user(friend_id, &message_str).await;
            }
        }
        
        Ok(())
    }

    pub async fn cache_user_friends(&self, user_id: Uuid, friend_ids: &[Uuid]) -> Result<()> {
        let mut redis_conn = self.redis_client.get_connection()?;
        let friends_key = format!("user:{}:friends", user_id);
        
        // Clear existing friends
        let _: () = redis_conn.del(&friends_key)?;
        
        // Add current friends
        if !friend_ids.is_empty() {
            let friend_strings: Vec<String> = friend_ids.iter().map(|id| id.to_string()).collect();
            let _: () = redis_conn.sadd(&friends_key, friend_strings)?;
        }
        
        Ok(())
    }
}
