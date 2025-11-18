'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Friend = {
  id: string;
  name: string;
  email: string;
  status: 'ACCEPTED' | 'PENDING' | 'REQUESTED';
  createdAt: string;
};

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/user/friends');
      const data = await response.json();
      setFriends(data.friends || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const response = await fetch('/api/user/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail }),
      });

      if (response.ok) {
        setSearchEmail('');
        fetchFriends(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const acceptRequest = async (friendId: string) => {
    try {
      const response = await fetch('/api/user/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: friendId }),
      });

      if (response.ok) {
        setFriends(friends.map(f =>
          f.id === friendId ? { ...f, status: 'ACCEPTED' as const } : f
        ));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const response = await fetch('/api/user/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: friendId }),
      });

      if (response.ok) {
        setFriends(friends.filter(f => f.id !== friendId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  const acceptedFriends = friends.filter(f => f.status === 'ACCEPTED');
  const pendingRequests = friends.filter(f => f.status === 'REQUESTED');
  const sentRequests = friends.filter(f => f.status === 'PENDING');

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Friends</h1>
        <p className="text-muted-foreground">
          Connect with people and share your oral history videos
        </p>
      </div>

      {/* Add Friend */}
      <Card>
        <CardHeader>
          <CardTitle>Add Friend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter friend's email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <Button onClick={sendFriendRequest} disabled={!searchEmail}>
              Send Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests (received) */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Friend Requests
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{friend.name || friend.email}</p>
                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptRequest(friend.id)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFriend(friend.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Requests (pending) */}
      {sentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentRequests.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{friend.name || friend.email}</p>
                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                    <Badge variant="secondary" className="mt-1">Pending</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFriend(friend.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Friends */}
      <Card>
        <CardHeader>
          <CardTitle>
            My Friends
            {acceptedFriends.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {acceptedFriends.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">Loading...</div>
          )}

          {!loading && acceptedFriends.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg mb-2">No friends yet</p>
              <p className="text-sm">Add friends to share your oral history videos!</p>
            </div>
          )}

          {!loading && acceptedFriends.length > 0 && (
            <div className="space-y-3">
              {acceptedFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{friend.name || friend.email}</p>
                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Friends since {new Date(friend.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFriend(friend.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
