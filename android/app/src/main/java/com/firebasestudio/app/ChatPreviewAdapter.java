package com.firebasestudio.app;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class ChatPreviewAdapter extends RecyclerView.Adapter<ChatPreviewAdapter.ChatViewHolder> {

    private final Context context;
    private final List<ChatPreview> chats;

    public ChatPreviewAdapter(Context context, List<ChatPreview> chats) {
        this.context = context;
        this.chats = chats;
    }

    @NonNull
    @Override
    public ChatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_chat_preview, parent, false);
        return new ChatViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ChatViewHolder holder, int position) {
        ChatPreview chat = chats.get(position);
        holder.name.setText(chat.getName());
        holder.preview.setText(chat.getPreview());
        holder.time.setText(chat.getTime());
        holder.badge.setVisibility(chat.getUnreadCount() > 0 ? View.VISIBLE : View.GONE);
        holder.badge.setText(String.valueOf(chat.getUnreadCount()));
        holder.onlineIndicator.setVisibility(chat.isOnline() ? View.VISIBLE : View.GONE);

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(context, ConversationActivity.class);
            intent.putExtra(ConversationActivity.EXTRA_CHAT_ID, chat.getId());
            intent.putExtra(ConversationActivity.EXTRA_CHAT_NAME, chat.getName());
            context.startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return chats.size();
    }

    static class ChatViewHolder extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final View onlineIndicator;
        final TextView name;
        final TextView preview;
        final TextView time;
        final TextView badge;

        ChatViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.chatAvatar);
            onlineIndicator = itemView.findViewById(R.id.onlineIndicator);
            name = itemView.findViewById(R.id.chatName);
            preview = itemView.findViewById(R.id.chatPreview);
            time = itemView.findViewById(R.id.chatTime);
            badge = itemView.findViewById(R.id.chatBadge);
        }
    }
}
