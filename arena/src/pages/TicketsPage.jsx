import React, { useEffect, useState } from 'react';
import { Ticket, MapPin, Calendar, Users, QrCode, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
//import { hederaService } from '../services/hederaService';

export default function TicketsPage() {
  const { wallet } = useStore();
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
    if (wallet.isConnected) {
      fetchMyTickets();
    }
  }, [wallet.isConnected]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // In production, fetch from Firebase or Hedera Mirror Node
      // For now, mock data
      const mockEvents = [
        {
          battleId: 1,
          eventName: 'HedRap Championship Finals',
          venue: 'National Stadium, Lagos',
          eventDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          totalTickets: 1000,
          ticketsSold: 437,
          ticketPrice: 5000000000, // 50 HBAR in tinybars
          active: true,
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const ticketIds = await hederaService.getUserTickets(wallet.accountId);
      const tickets = await Promise.all(
        ticketIds.map(id => hederaService.getTicket(id))
      );
      setMyTickets(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handlePurchaseTicket = async (event) => {
    if (!wallet.isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    const seatNumber = `A${Math.floor(Math.random() * 100) + 1}`;

    try {
      setLoading(true);
      await hederaService.purchaseTicket(
        event.battleId,
        seatNumber,
        event.ticketPrice
      );
      alert('Ticket purchased successfully! 🎉');
      fetchEvents();
      fetchMyTickets();
    } catch (error) {
      alert(`Error purchasing ticket: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Event Tickets</h1>
        <p className="text-gray-400">
          Purchase verified NFT tickets for live battle rap events
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-700">
        <button className="px-6 py-3 border-b-2 border-purple-500 font-semibold">
          Upcoming Events
        </button>
        <button className="px-6 py-3 text-gray-400 hover:text-white font-semibold">
          My Tickets ({myTickets.length})
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.battleId}
              event={event}
              onPurchase={handlePurchaseTicket}
            />
          ))}
        </div>
      )}

      {/* My Tickets Section */}
      {wallet.isConnected && myTickets.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">My Tickets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTickets.map((ticket) => (
              <TicketCard key={ticket.ticketId} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-16 bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">How NFT Tickets Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Purchase</h3>
            <p className="text-sm text-gray-300">
              Buy verified NFT ticket on-chain
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">QR Code</h3>
            <p className="text-sm text-gray-300">
              Unique QR code generated for you
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Verify</h3>
            <p className="text-sm text-gray-300">
              Scan at entrance, prevents fakes
            </p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">4</span>
            </div>
            <h3 className="font-semibold mb-2">Attend</h3>
            <p className="text-sm text-gray-300">
              Enjoy the live battle rap event!
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Counterfeits</h3>
          <p className="text-gray-400">
            Every ticket verified on-chain. Impossible to fake or duplicate.
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <ArrowRight className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Transferable</h3>
          <p className="text-gray-400">
            Can't attend? Transfer your ticket to a friend on-chain.
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="bg-yellow-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Keep as NFT</h3>
          <p className="text-gray-400">
            After the event, keep your ticket as a digital collectible.
          </p>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, onPurchase }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ticketsRemaining = event.totalTickets - event.ticketsSold;
  const percentageSold = (event.ticketsSold / event.totalTickets) * 100;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-purple-900 hover:border-purple-500 transition-all">
      <div className="h-48 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
        <Ticket className="w-24 h-24 text-white opacity-20" />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">{event.eventName}</h3>

        <div className="space-y-3 text-sm mb-4">
          <div className="flex items-center text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(event.eventDate)}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Users className="w-4 h-4 mr-2" />
            <span>{ticketsRemaining} tickets left</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Sold</span>
            <span>{percentageSold.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${percentageSold}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-gray-400">Price</div>
            <div className="text-2xl font-bold">
              {(event.ticketPrice / 100000000).toFixed(1)} ℏ
            </div>
          </div>
        </div>

        <button
          onClick={() => onPurchase(event)}
          disabled={!event.active || ticketsRemaining === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
        >
          {ticketsRemaining === 0 ? 'Sold Out' : 'Purchase Ticket'}
        </button>
      </div>
    </div>
  );
}

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6 border-2 border-green-500">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white rounded-lg p-2">
          <QrCode className="w-8 h-8 text-green-900" />
        </div>
        <div className="flex gap-2">
          {ticket.verified && (
            <span className="bg-green-500 text-xs font-semibold px-2 py-1 rounded-full">
              VERIFIED
            </span>
          )}
          {ticket.used && (
            <span className="bg-gray-500 text-xs font-semibold px-2 py-1 rounded-full">
              USED
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2">Ticket #{ticket.ticketId}</h3>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-300">Seat</span>
          <span className="font-semibold">{ticket.seatNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Price</span>
          <span className="font-semibold">
            {(ticket.price / 100000000).toFixed(1)} ℏ
          </span>
        </div>
      </div>

      {!ticket.used && (
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full bg-white text-green-900 font-semibold py-2 rounded-lg hover:bg-gray-100 transition"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>
      )}

      {showQR && !ticket.used && (
        <div className="mt-4 bg-white p-4 rounded-lg">
          <div className="text-center text-green-900 font-mono text-xs break-all">
            {ticket.qrCodeHash}
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            Show this code at the entrance
          </p>
        </div>
      )}
    </div>
  );
}
