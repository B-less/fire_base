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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ChatPreviewAdapter extends RecyclerView.Adapter<ChatPreviewAdapter.ChatViewHolder> {

    public interface OnChatClickListener {
        void onChatClick(ChatPreview chatPreview);
    }

    private final Context context;
    private final List<ChatPreview> sourceChats;
    private final List<ChatPreview> visibleChats;
    private String activeQuery = "";
    @NonNull private final OnChatClickListener clickListener;

    public ChatPreviewAdapter(Context context, List<ChatPreview> chats) {
        this(context, chats, null);
    }

    public ChatPreviewAdapter(Context context, List<ChatPreview> chats, OnChatClickListener listener) {
        this.context = context;
        this.sourceChats = new ArrayList<>(chats);
        this.visibleChats = new ArrayList<>(chats);
        this.clickListener = listener == null ? this::openConversation : listener;
    }

    @NonNull
    @Override
    public ChatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_chat_preview, parent, false);
        return new ChatViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ChatViewHolder holder, int position) {
        ChatPreview chat = visibleChats.get(position);
        holder.name.setText(chat.getName());
        holder.preview.setText(chat.getPreview());
        holder.time.setText(chat.getTime());
        holder.badge.setVisibility(chat.getUnreadCount() > 0 ? View.VISIBLE : View.GONE);
        holder.badge.setText(String.valueOf(chat.getUnreadCount()));
        holder.onlineIndicator.setVisibility(chat.isOnline() ? View.VISIBLE : View.GONE);
        MediaUtils.loadImageInto(context, chat.getAvatarUrl(), holder.avatar, R.mipmap.ic_launcher_round);

        holder.itemView.setOnClickListener(v -> clickListener.onChatClick(chat));
    }

    @Override
    public int getItemCount() {
        return visibleChats.size();
    }

    public void replaceChats(List<ChatPreview> chats) {
        sourceChats.clear();
        sourceChats.addAll(chats);
        applyFilter();
    }

    public void filter(String query) {
        activeQuery = query == null ? "" : query.trim().toLowerCase(Locale.US);
        applyFilter();
    }

    private void applyFilter() {
        visibleChats.clear();
        if (activeQuery.isEmpty()) {
            visibleChats.addAll(sourceChats);
        } else {
            for (ChatPreview chat : sourceChats) {
                if (chat.getName().toLowerCase(Locale.US).contains(activeQuery)
                        || chat.getPreview().toLowerCase(Locale.US).contains(activeQuery)
                        || chat.getId().toLowerCase(Locale.US).contains(activeQuery)) {
                    visibleChats.add(chat);
                }
            }
        }
        notifyDataSetChanged();
    }

    private void openConversation(@NonNull ChatPreview chat) {
        Intent intent = new Intent(context, ConversationActivity.class);
        intent.putExtra(ConversationActivity.EXTRA_CHAT_ID, chat.getId());
        intent.putExtra(ConversationActivity.EXTRA_CHAT_NAME, chat.getName());
        context.startActivity(intent);
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
