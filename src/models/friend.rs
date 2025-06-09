use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Friendship {
    pub id: Uuid,
    pub user_id: Uuid,
    pub friend_id: Uuid,
    pub status: FriendshipStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "friendship_status", rename_all = "lowercase")]
pub enum FriendshipStatus {
    Pending,
    Accepted,
    Blocked,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FriendResponse {
    pub id: Uuid,
    pub user: FriendUser,
    pub status: FriendshipStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FriendUser {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub is_online: bool,
    pub last_seen: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct SendFriendRequestRequest {
    pub friend_email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FriendRequest {
    pub id: Uuid,
    pub from_user: FriendUser,
    pub to_user: FriendUser,
    pub status: FriendshipStatus,
    pub created_at: DateTime<Utc>,
}
