package com.firebasestudio.app;

import android.content.Intent;
import android.graphics.Bitmap;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class MessageAdapter extends RecyclerView.Adapter<MessageAdapter.MessageViewHolder> {

    private static final int TYPE_SENT = 1;
    private static final int TYPE_RECEIVED = 2;

    private final List<MessageUiModel> messages;

    public MessageAdapter(List<MessageUiModel> messages) {
        this.messages = new ArrayList<>(messages);
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isSentByMe() ? TYPE_SENT : TYPE_RECEIVED;
    }

    @NonNull
    @Override
    public MessageViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layoutId = viewType == TYPE_SENT ? R.layout.item_message_sent : R.layout.item_message_received;
        View view = LayoutInflater.from(parent.getContext()).inflate(layoutId, parent, false);
        return new MessageViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MessageViewHolder holder, int position) {
        MessageUiModel message = messages.get(position);
        holder.messageMeta.setText(message.getMeta());

        if (message.getText() != null && !message.getText().trim().isEmpty()) {
            holder.messageText.setText(message.getText());
            holder.messageText.setVisibility(View.VISIBLE);
        } else {
            holder.messageText.setVisibility(View.GONE);
        }

        if (message.hasImage()) {
            Bitmap bitmap = MediaUtils.decodeImage(message.getImageUrl());
            if (bitmap != null) {
                holder.messageImage.setImageBitmap(bitmap);
                holder.messageImage.setVisibility(View.VISIBLE);
                holder.messageImage.setOnClickListener(v -> openMedia(holder, message.getImageUrl(), "image"));
            } else {
                holder.messageImage.setVisibility(View.GONE);
            }
        } else {
            holder.messageImage.setVisibility(View.GONE);
        }

        if (message.hasVideo()) {
            holder.messageVideoCard.setVisibility(View.VISIBLE);
            holder.messageVideoCard.setOnClickListener(v -> openMedia(holder, message.getVideoUrl(), "video"));
        } else {
            holder.messageVideoCard.setVisibility(View.GONE);
        }

        if (message.hasAudio()) {
            holder.messageAudioCard.setVisibility(View.VISIBLE);
        } else {
            holder.messageAudioCard.setVisibility(View.GONE);
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    public void replaceMessages(List<MessageUiModel> nextMessages) {
        messages.clear();
        messages.addAll(nextMessages);
        notifyDataSetChanged();
    }

    private void openMedia(@NonNull MessageViewHolder holder, String mediaUrl, String mediaType) {
        Intent intent = new Intent(holder.itemView.getContext(), MediaViewerActivity.class);
        intent.putExtra(MediaViewerActivity.EXTRA_MEDIA_URL, mediaUrl);
        intent.putExtra(MediaViewerActivity.EXTRA_MEDIA_TYPE, mediaType);
        intent.putExtra(
                MediaViewerActivity.EXTRA_MEDIA_TITLE,
                "video".equals(mediaType) ? holder.itemView.getContext().getString(R.string.media_label_video) : holder.itemView.getContext().getString(R.string.media_label_photo)
        );
        holder.itemView.getContext().startActivity(intent);
    }

    static class MessageViewHolder extends RecyclerView.ViewHolder {
        final TextView messageText;
        final TextView messageMeta;
        final ImageView messageImage;
        final LinearLayout messageVideoCard;
        final LinearLayout messageAudioCard;

        MessageViewHolder(@NonNull View itemView) {
            super(itemView);
            messageText = itemView.findViewById(R.id.messageText);
            messageMeta = itemView.findViewById(R.id.messageMeta);
            messageImage = itemView.findViewById(R.id.messageImage);
            messageVideoCard = itemView.findViewById(R.id.messageVideoCard);
            messageAudioCard = itemView.findViewById(R.id.messageAudioCard);
        }
    }
}
