'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, Search, User, Send, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface TelegramUser {
    id: number;
    username: string | null;
    first_name: string | null;
}

interface SupportMessage {
    id: string;
    user_id: number;
    message_type: 'text' | 'photo';
    content: string | null;
    file_url: string | null;
    created_at: string;
}

export default function SupportPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<TelegramUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Use a ref for selectedUser to access current value inside setInterval closure
    const selectedUserRef = useRef<TelegramUser | null>(null);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('telegram_users')
                .select('*')
                .order('first_name', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchMessages = async (userId: number, showLoader = false) => {
        if (showLoader) setIsLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            if (showLoader) setIsLoadingMessages(false);
        }
    };

    // Initial Load and Polling
    useEffect(() => {
        fetchUsers();

        const interval = setInterval(() => {
            fetchUsers();
            if (selectedUserRef.current) {
                // Pass false to not show loader during background refresh
                fetchMessages(selectedUserRef.current.id, false);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Fetch when user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id, true);
        } else {
            setMessages([]);
        }
    }, [selectedUser]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const filteredUsers = users.filter(user =>
        (user.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery)
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background">
            {/* Sidebar - User List */}
            <div className="w-80 border-r flex flex-col bg-card/50">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Support Chats
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-8 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoadingUsers ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-accent/50 transition-colors flex items-center gap-3",
                                        selectedUser?.id === user.id && "bg-accent"
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">
                                            {user.first_name || 'Unknown User'}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            @{user.username || 'No username'} • ID: {user.id}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content - Chat Area */}
            <div className="flex-1 flex flex-col bg-background/50">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-card shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {selectedUser.first_name || 'Unknown User'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Telegram ID: {selectedUser.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20"
                        >
                            {isLoadingMessages ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                    <MessageSquare className="w-12 h-12 mb-2" />
                                    <p>No messages yet.</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className="flex flex-col items-start max-w-[80%]">
                                        <div className="bg-card border rounded-lg p-3 shadow-sm relative group">
                                            {msg.message_type === 'photo' && msg.file_url && (
                                                <div className="mb-2 rounded-md overflow-hidden relative border min-w-[200px] min-h-[150px]">
                                                    <img
                                                        src={msg.file_url}
                                                        alt="User upload"
                                                        className="max-w-full h-auto object-cover rounded"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            {msg.content && (
                                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                                    {msg.content}
                                                </p>
                                            )}

                                            <p className="text-[10px] text-muted-foreground text-right mt-1 opacity-70">
                                                {new Date(msg.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area (Read Only) */}
                        <div className="p-4 border-t bg-card">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm italic">
                                <span className="p-2">Read-only view of Telegram messages. Auto-refreshes every 5s.</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Select a user to view conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
}
