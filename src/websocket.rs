use axum::extract::ws::{Message, WebSocket};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde_json;
use tokio::select;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::{
    models::{SendMessageRequest, TypingIndicator, WebSocketMessage},
    AppState,
};

pub async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut user_id: Option<Uuid> = None;
    let mut ws_receiver: Option<tokio::sync::broadcast::Receiver<String>> = None;

    loop {
        select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Err(e) = handle_text_message(&text, &mut user_id, &mut ws_receiver, &state).await {
                            error!("Error handling text message: {}", e);
                            break;
                        }
                    }
                    Some(Ok(Message::Close(_))) => {
                        info!("WebSocket connection closed");
                        break;
                    }
                    Some(Err(e)) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    None => break,
                    _ => {}
                }
            }
            broadcast_msg = async {
                if let Some(ref mut rx) = ws_receiver {
                    rx.recv().await
                } else {
                    std::future::pending().await
                }
            } => {
                match broadcast_msg {
                    Ok(msg) => {
                        if let Err(e) = sender.send(Message::Text(msg)).await {
                            error!("Error sending broadcast message: {}", e);
                            break;
                        }
                    }
                    Err(e) => {
                        warn!("Broadcast receiver error: {}", e);
                    }
                }
            }
        }
    }

    // Cleanup on disconnect
    if let Some(uid) = user_id {
        let _ = state.services.websocket.remove_connection(uid).await;
        let _ = state.services.user.update_online_status(uid, false).await;
        let _ = state.services.websocket.broadcast_user_status(uid, false).await;
    }
}

async fn handle_text_message(
    text: &str,
    user_id: &mut Option<Uuid>,
    ws_receiver: &mut Option<tokio::sync::broadcast::Receiver<String>>,
    state: &AppState,
) -> anyhow::Result<()> {
    let ws_message: WebSocketMessage = serde_json::from_str(text)?;

    match ws_message.message_type.as_str() {
        "auth" => {
            let token: String = serde_json::from_value(ws_message.data)?;
            let uid = state.services.auth.verify_access_token(&token)?;
            
            *user_id = Some(uid);
            *ws_receiver = Some(state.services.websocket.add_connection(uid).await);
            
            // Update user online status
            state.services.user.update_online_status(uid, true).await?;
            state.services.websocket.broadcast_user_status(uid, true).await?;
            
            info!("User {} authenticated via WebSocket", uid);
        }
        "send_message" => {
            if let Some(uid) = user_id {
                let request: SendMessageRequest = serde_json::from_value(ws_message.data)?;
                
                // Send message through message service
                if let Ok(message) = state.services.message.send_message(*uid, request).await {
                    // Get chat participants
                    let participants = state.services.message.get_chat_participants(message.chat_id).await?;
                    
                    // Broadcast to all participants
                    state.services.websocket.broadcast_message(&message, &participants).await?;
                }
            }
        }
        "typing" => {
            if let Some(uid) = user_id {
                let mut typing: TypingIndicator = serde_json::from_value(ws_message.data)?;
                typing.user_id = *uid;
                
                // Get chat participants
                let participants = state.services.message.get_chat_participants(typing.chat_id).await?;
                
                // Broadcast typing indicator
                state.services.websocket.broadcast_typing(&typing, &participants).await?;
            }
        }
        _ => {
            warn!("Unknown WebSocket message type: {}", ws_message.message_type);
        }
    }

    Ok(())
}
