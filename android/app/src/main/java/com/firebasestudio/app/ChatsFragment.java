package com.firebasestudio.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class ChatsFragment extends Fragment {

    private final FirebaseChatRepository repository = new FirebaseChatRepository();
    private FirebaseChatRepository.Subscription chatsSubscription;
    private NativeSessionManager.NativeUserSession session;
    private LinearLayout emptyState;
    private RecyclerView recyclerView;
    private ChatPreviewAdapter adapter;

    public void setSession(@Nullable NativeSessionManager.NativeUserSession session) {
        this.session = session;
        if (isAdded()) {
            bindChats();
        }
    }

    public void filter(String query) {
        if (adapter == null) {
            return;
        }
        adapter.filter(query);
        updateEmptyState();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_chats, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        recyclerView = view.findViewById(R.id.chatRecyclerView);
        emptyState = view.findViewById(R.id.emptyState);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ChatPreviewAdapter(requireContext(), new ArrayList<>());
        recyclerView.setAdapter(adapter);
        bindChats();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (chatsSubscription != null) {
            chatsSubscription.dispose();
            chatsSubscription = null;
        }
        recyclerView = null;
        emptyState = null;
        adapter = null;
    }

    private void bindChats() {
        if (recyclerView == null) {
            return;
        }
        if (chatsSubscription != null) {
            chatsSubscription.dispose();
            chatsSubscription = null;
        }
        if (adapter == null) {
            adapter = new ChatPreviewAdapter(requireContext(), new ArrayList<>());
            recyclerView.setAdapter(adapter);
        }

        if (session == null) {
            adapter.replaceChats(new ArrayList<>());
            updateEmptyState();
            return;
        }

        chatsSubscription = repository.observeChats(session.getPhoneNumber(), new FirebaseChatRepository.ChatsListener() {
            @Override
            public void onChatsUpdated(List<ChatPreview> chats) {
                if (!isAdded()) {
                    return;
                }
                requireActivity().runOnUiThread(() -> {
                    if (adapter != null) {
                        adapter.replaceChats(chats);
                        updateEmptyState();
                    }
                });
            }

            @Override
            public void onError(String message) {
                if (!isAdded()) {
                    return;
                }
                requireActivity().runOnUiThread(() ->
                        Toast.makeText(requireContext(), "Could not load chats: " + message, Toast.LENGTH_SHORT).show()
                );
            }
        });
    }

    private void updateEmptyState() {
        if (emptyState == null || recyclerView == null) {
            return;
        }
        RecyclerView.Adapter<?> adapter = recyclerView.getAdapter();
        boolean isEmpty = adapter == null || adapter.getItemCount() == 0;
        emptyState.setVisibility(isEmpty ? View.VISIBLE : View.GONE);
        recyclerView.setVisibility(isEmpty ? View.GONE : View.VISIBLE);
    }
}
