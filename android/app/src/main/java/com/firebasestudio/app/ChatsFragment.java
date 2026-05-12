package com.firebasestudio.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class ChatsFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_chats, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        RecyclerView recyclerView = view.findViewById(R.id.chatRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(new ChatPreviewAdapter(requireContext(), createMockChats()));
    }

    private List<ChatPreview> createMockChats() {
        List<ChatPreview> chats = new ArrayList<>();
        chats.add(new ChatPreview("bless", "BlessBF", "You: We’re moving Chirp Chat to native.", "3:50 PM", 2, true));
        chats.add(new ChatPreview("ai", "AI Assistant", "Image concept is ready for review.", "2:18 PM", 0, false));
        chats.add(new ChatPreview("peace", "Peace", "Okay, I’ll check it right now.", "12:40 PM", 1, true));
        chats.add(new ChatPreview("ib", "IBTVG", "Shared a new promo graphic.", "Yesterday", 0, false));
        chats.add(new ChatPreview("team", "Team Chirp", "Native rewrite phase one is underway.", "Yesterday", 5, true));
        return chats;
    }
}
