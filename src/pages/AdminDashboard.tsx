import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  LogOut,
  Trophy,
  Users,
  Gamepad2,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  X,
  Settings,
  BarChart3,
  User,
  Ticket,
  TrendingUp,
  TrendingDown,
  Banknote
} from "lucide-react";

type Game = {
  id: number;
  title: string;
  team1: string;
  team2: string;
  league: string | null;
  status: string;
  campaign_start_at: string | null;
  campaign_end_at: string | null;
  winner: string | null;
  finished_at: string | null;
  created_at: string;
};

type Bet = {
  id: number;
  user_id: number;
  game_id: number;
  bet_on: string;
  amount: number;
  status: string;
  payout: number | null;
  created_at: string;
  games?: Game;
  users?: { name: string; username: string };
};

// Pre-generated time options (every 15 minutes) for the custom time picker
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const label = format(new Date(1970, 0, 1, hour, minute), "hh:mm a");
  return { value, label };
});

const formatTimeLabel = (time: string) => {
  if (!time) return "--:-- --";
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "--:-- --";
  return format(new Date(1970, 0, 1, hour, minute), "hh:mm a");
};

const AdminDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [activeTab, setActiveTab] = useState<'games' | 'bets' | 'users' | 'stats'>('games');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const navigate = useNavigate();
  const [nowTs, setNowTs] = useState(() => Date.now());

  const [gameForm, setGameForm] = useState({
    title: "",
    team1: "",
    team2: "",
  });

  // Campaign dialog state
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedGameForCampaign, setSelectedGameForCampaign] = useState<Game | null>(null);
  const [campaignStartDate, setCampaignStartDate] = useState<Date | undefined>(undefined);
  const [campaignEndDate, setCampaignEndDate] = useState<Date | undefined>(undefined);
  const [campaignStartTime, setCampaignStartTime] = useState("");
  const [campaignEndTime, setCampaignEndTime] = useState("");
  const [campaignStartDateOpen, setCampaignStartDateOpen] = useState(false);
  const [campaignEndDateOpen, setCampaignEndDateOpen] = useState(false);
  const [campaignStartTimeOpen, setCampaignStartTimeOpen] = useState(false);
  const [campaignEndTimeOpen, setCampaignEndTimeOpen] = useState(false);
  const startTimeScrollRef = useRef<HTMLDivElement>(null);
  const endTimeScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/");
        return;
      }

      const role = user.user_metadata?.role;
      if (role !== "super_admin") {
        navigate("/dashboard");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
    loadGames();
    loadBets();
    loadUsers();
  }, [navigate]);

  // Keep time-based UI (campaign scheduled/live/ended) fresh without requiring a hard refresh.
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const getCampaignState = (game: Game): "not_set" | "scheduled" | "live" | "ended" => {
    if (!game.campaign_start_at || !game.campaign_end_at) return "not_set";
    const start = new Date(game.campaign_start_at).getTime();
    const end = new Date(game.campaign_end_at).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return "not_set";
    if (nowTs < start) return "scheduled";
    if (nowTs >= start && nowTs <= end) return "live";
    return "ended";
  };

  // Auto-scroll to selected time when time picker opens
  useEffect(() => {
    if (campaignStartTimeOpen && startTimeScrollRef.current && campaignStartTime) {
      const selectedIndex = TIME_OPTIONS.findIndex(opt => opt.value === campaignStartTime);
      if (selectedIndex !== -1) {
        const buttonElement = startTimeScrollRef.current.children[selectedIndex] as HTMLElement;
        if (buttonElement) {
          setTimeout(() => {
            buttonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
  }, [campaignStartTimeOpen, campaignStartTime]);

  useEffect(() => {
    if (campaignEndTimeOpen && endTimeScrollRef.current && campaignEndTime) {
      const selectedIndex = TIME_OPTIONS.findIndex(opt => opt.value === campaignEndTime);
      if (selectedIndex !== -1) {
        const buttonElement = endTimeScrollRef.current.children[selectedIndex] as HTMLElement;
        if (buttonElement) {
          setTimeout(() => {
            buttonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
  }, [campaignEndTimeOpen, campaignEndTime]);

  const loadGames = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading games:", error);
      return;
    }

    if (data) setGames(data as Game[]);
  };

  const loadBets = async () => {
    const { data, error } = await supabase
      .from("bets")
      .select(`
        *,
        games (*),
        users:user_id (name, username)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading bets:", error);
      return;
    }

    if (data) setBets(data as Bet[]);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    if (data) setAllUsers(data);
  };

  const handleCreateGame = async () => {
    if (!gameForm.title || !gameForm.team1 || !gameForm.team2) {
      toast.error("Please fill all required fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.user_metadata?.user_id;

    const { error } = await supabase.from("games").insert({
      title: gameForm.title,
      team1: gameForm.team1,
      team2: gameForm.team2,
      league: "NFL",
      campaign_start_at: null,
      campaign_end_at: null,
      status: "upcoming",
      created_by: userId,
    });

    if (error) {
      toast.error(`Failed to create game: ${error.message}`);
      return;
    }

    toast.success("Game created successfully! You can start the campaign later.");
    setGameForm({
      title: "",
      team1: "",
      team2: "",
    });
    setShowGameForm(false);
    loadGames();
  };

  const handleOpenCampaignDialog = (game: Game) => {
    setSelectedGameForCampaign(game);
    setCampaignDialogOpen(true);
    setCampaignStartDate(undefined);
    setCampaignEndDate(undefined);
    setCampaignStartTime("");
    setCampaignEndTime("");
  };

  const handleStartCampaign = async () => {
    if (!selectedGameForCampaign) return;

    if (!campaignStartDate || !campaignStartTime || !campaignEndDate || !campaignEndTime) {
      toast.error("Please set campaign start and end date & time");
      return;
    }

    // Combine date and time into ISO string
    const startDateStr = format(campaignStartDate, "yyyy-MM-dd");
    const endDateStr = format(campaignEndDate, "yyyy-MM-dd");
    const campaignStartAt = new Date(`${startDateStr}T${campaignStartTime}`).toISOString();
    const campaignEndAt = new Date(`${endDateStr}T${campaignEndTime}`).toISOString();

    if (campaignEndAt <= campaignStartAt) {
      toast.error("Campaign end time must be after start time");
      return;
    }

    const { error } = await supabase
      .from("games")
      .update({
        campaign_start_at: campaignStartAt,
        campaign_end_at: campaignEndAt,
        status: "upcoming",
      })
      .eq("id", selectedGameForCampaign.id);

    if (error) {
      toast.error(`Failed to start campaign: ${error.message}`);
      return;
    }

    toast.success("Campaign started successfully! Users can now see and bet on this game.");
    setCampaignDialogOpen(false);
    setSelectedGameForCampaign(null);
    setCampaignStartDate(undefined);
    setCampaignEndDate(undefined);
    setCampaignStartTime("");
    setCampaignEndTime("");
    loadGames();
  };

  const handleUpdateGameStatus = async (gameId: number, newStatus: string) => {
    const { error } = await supabase
      .from("games")
      .update({ status: newStatus })
      .eq("id", gameId);

    if (error) {
      toast.error(`Failed to update game: ${error.message}`);
      return;
    }

    toast.success("Game status updated!");
    loadGames();
  };

  const handleSetWinner = async (gameId: number, winner: 'team1' | 'team2') => {
    const { data: gameData, error: gameFetchError } = await supabase
      .from("games")
      .select("odds1, odds2, status")
      .eq("id", gameId)
      .single();

    if (gameFetchError || !gameData) {
      toast.error(`Failed to load game odds: ${gameFetchError?.message || "Unknown error"}`);
      return;
    }

    const { error } = await supabase
      .from("games")
      .update({
        status: "finished",
        winner,
        finished_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (error) {
      toast.error(`Failed to set winner: ${error.message}`);
      return;
    }

    // Auto-settle bets
    const { data: gameBets } = await supabase
      .from("bets")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", "pending");

    if (gameBets && gameBets.length > 0) {
      let wonBetsCount = 0;
      let totalPayout = 0;

      for (const bet of gameBets) {
        const won = bet.bet_on === winner;
        let payout = 0;

        if (won) {
          // Calculate payout based on odds
          // Odds format: "+150" means win $150 on $100 bet, "-120" means bet $120 to win $100
          const oddsStr = winner === "team1" ? gameData.odds1 : gameData.odds2;
          const betAmount = Number(bet.amount);

          // Parse odds
          if (oddsStr.startsWith('+')) {
            // Positive odds: +150 means you win $150 on a $100 bet
            const oddsValue = parseFloat(oddsStr.substring(1));
            payout = betAmount + (betAmount * oddsValue / 100);
          } else if (oddsStr.startsWith('-')) {
            // Negative odds: -120 means you bet $120 to win $100
            const oddsValue = parseFloat(oddsStr.substring(1));
            payout = betAmount + (betAmount * 100 / oddsValue);
          } else {
            // Decimal odds (e.g., "1.5")
            const oddsValue = parseFloat(oddsStr);
            payout = betAmount * oddsValue;
          }

          wonBetsCount++;
          totalPayout += payout;
        }

        await supabase
          .from("bets")
          .update({
            status: won ? "won" : "lost",
            payout: won ? payout : 0,
          })
          .eq("id", bet.id);
      }

      toast.success(
        `Winner set! ${wonBetsCount} winning bet${wonBetsCount !== 1 ? 's' : ''} settled. Total payout: $${totalPayout.toFixed(2)}`
      );
    } else {
      toast.success("Winner set! No bets to settle.");
    }

    loadGames();
    loadBets();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalBets = bets.length;
  const totalBetAmount = bets.reduce((sum, bet) => sum + Number(bet.amount), 0);
  const pendingBets = bets.filter((b) => b.status === "pending").length;
  const activeGames = games.filter((g) => {
    const state = getCampaignState(g);
    // Consider "active" as scheduled or live campaigns (ended campaigns aren't active).
    return state === "scheduled" || state === "live";
  }).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300 relative">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold tracking-tight text-foreground">
              BIG MONEY GAMING
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setActiveTab('games')}
                className={`text-sm transition-colors border-b-2 border-transparent hover:border-accent pb-1 ${activeTab === 'games' ? 'text-accent border-accent' : 'text-accent/80 hover:text-accent'
                  }`}
              >
                Games
              </button>
              <button
                onClick={() => setActiveTab('bets')}
                className={`text-sm transition-colors border-b-2 border-transparent hover:border-accent pb-1 ${activeTab === 'bets' ? 'text-accent border-accent' : 'text-accent/80 hover:text-accent'
                  }`}
              >
                All Bets
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`text-sm transition-colors border-b-2 border-transparent hover:border-accent pb-1 ${activeTab === 'users' ? 'text-accent border-accent' : 'text-accent/80 hover:text-accent'
                  }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`text-sm transition-colors border-b-2 border-transparent hover:border-accent pb-1 ${activeTab === 'stats' ? 'text-accent border-accent' : 'text-accent/80 hover:text-accent'
                  }`}
              >
                Statistics
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-foreground">{user.user_metadata?.name || 'Admin'}</div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="px-3 py-2 text-sm font-semibold rounded-lg border border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        {/* Summary Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Games */}
          <Card className="p-5 border-border bg-card hover-lift animate-fade-up-delay-1 glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded uppercase">Active</span>
              </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Active Games</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-foreground">{activeGames}</p>
                {activeGames > 0 && (
                  <span className="text-green-400 text-xs font-medium">↑ Live</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Bets */}
          <Card className="p-5 border-border bg-card hover-lift animate-fade-up-delay-1 glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded uppercase">All Time</span>
              </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Bets</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-foreground">{totalBets}</p>
                {totalBets > 0 && (
                  <span className="text-green-400 text-xs font-medium">↑ Active</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Bet Amount */}
          <Card className="p-5 border-border bg-card hover-lift animate-fade-up-delay-1 glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded uppercase">Volume</span>
              </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Bet Amount</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-foreground">${totalBetAmount.toFixed(2)}</p>
                {totalBetAmount > 0 && (
                  <span className="text-green-400 text-xs font-medium">↑ Growing</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Bets */}
          <Card className="p-5 border-yellow-400/30 bg-card hover-lift animate-fade-up-delay-1 shadow-[0_0_20px_rgba(250,204,21,0.05)] glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded uppercase">Pending</span>
              </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Pending Bets</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-yellow-400">{pendingBets}</p>
                {pendingBets > 0 && (
                  <span className="text-yellow-400 text-xs font-medium">Awaiting</span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-border mb-6 animate-fade-up-delay-2">
          <button
            onClick={() => setActiveTab('games')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'games'
              ? 'text-accent'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Games
            </div>
            {activeTab === 'games' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bets')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'bets'
              ? 'text-accent'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              All Bets
            </div>
            {activeTab === 'bets' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'users'
              ? 'text-accent'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </div>
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'stats'
              ? 'text-accent'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </div>
            {activeTab === 'stats' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
            )}
          </button>
        </div>

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Manage Games</h2>
              <Button
                onClick={() => setShowGameForm(true)}
                className="btn-gold gold-glow font-semibold transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Game
              </Button>
            </div>

            {/* Games List */}
            <div className="space-y-4">
              {games.map((game) => (
                <Card key={game.id} className="border-border/60 hover:border-accent/30 hover-lift bg-card animate-fade-up-delay-3 glow-border transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{game.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge className="bg-accent/20 text-accent border-accent/30">
                            {game.league || "NFL"}
                          </Badge>
                          {(() => {
                            const state = getCampaignState(game);
                            if (game.status === "finished") {
                              return (
                                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                  finished
                                </Badge>
                              );
                            }
                            if (state === "live") {
                              return (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  live
                                </Badge>
                              );
                            }
                            if (state === "ended") {
                              return (
                                <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                                  campaign ended
                                </Badge>
                              );
                            }
                            if (state === "scheduled") {
                              return (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  upcoming
                                </Badge>
                              );
                            }
                            return (
                              <Badge className="bg-muted/20 text-muted-foreground border-border/40">
                                draft
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Team 1</p>
                        <p className="font-semibold">{game.team1}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Team 2</p>
                        <p className="font-semibold">{game.team2}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Campaign: {game.campaign_start_at ? new Date(game.campaign_start_at).toLocaleString() : "Not set"} - {game.campaign_end_at ? new Date(game.campaign_end_at).toLocaleString() : "Not set"}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap items-center relative z-10 pointer-events-auto">
                      {!game.campaign_start_at && !game.campaign_end_at && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenCampaignDialog(game)}
                          className="btn-gold gold-glow transition-all hover:scale-105"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Start Campaign
                        </Button>
                      )}
                      {(() => {
                        const state = getCampaignState(game);
                        if (game.winner) return null;
                        if (state === "scheduled") {
                          return (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Campaign Scheduled
                            </Badge>
                          );
                        }
                        if (state === "live") {
                          return (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Campaign Live
                            </Badge>
                          );
                        }
                        if (state === "ended") {
                          return (
                            <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                              Campaign Ended
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                      {(() => {
                        const state = getCampaignState(game);
                        // Show winner selection buttons when campaign has ended and no winner is set yet
                        if (state === "ended" && !game.winner) {
                          return (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSetWinner(game.id, "team1");
                                }}
                                className="btn-gold gold-glow transition-all hover:scale-105 relative z-20"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {game.team1} Wins
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSetWinner(game.id, "team2");
                                }}
                                className="btn-gold gold-glow transition-all hover:scale-105 relative z-20"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {game.team2} Wins
                              </Button>
                            </>
                          );
                        }
                        return null;
                      })()}
                      {game.winner && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Winner: {game.winner === "team1" ? game.team1 : game.team2}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bets Tab */}
        {activeTab === 'bets' && (
          <div className="space-y-4 animate-fade-up-delay-2">
            <h2 className="text-2xl font-bold tracking-tight">All Bets</h2>
            <div className="space-y-4">
              {bets.map((bet) => (
                <Card key={bet.id} className="border-border/60 bg-card hover-lift animate-fade-up-delay-3 glow-border transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {bet.users?.name || bet.users?.username || `User #${bet.user_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bet on: {bet.bet_on === "team1" ? bet.games?.team1 : bet.games?.team2} | Amount: ${bet.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Game: {bet.games?.title || `Game #${bet.game_id}`}
                        </p>
                      </div>
                      <Badge
                        className={
                          bet.status === "won"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : bet.status === "lost"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }
                      >
                        {bet.status}
                      </Badge>
                    </div>
                    {bet.payout !== null && (
                      <p className="text-sm text-accent mt-2">Payout: ${bet.payout}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-up-delay-2">
            <h2 className="text-2xl font-bold tracking-tight">All Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUsers.map((user) => (
                <Card key={user.id} className="border-border/60 bg-card hover-lift animate-fade-up-delay-3 glow-border transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <Badge
                        className={
                          user.role === "super_admin"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-accent/20 text-accent border-accent/30"
                        }
                      >
                        {user.role === "super_admin" ? "Admin" : "User"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {allUsers.length === 0 && (
              <Card className="border-border/60 bg-card">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No users found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-up-delay-2">
            <h2 className="text-2xl font-bold tracking-tight">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card hover-lift animate-fade-up-delay-3 glow-border transition-all duration-300">
                <CardHeader>
                  <CardTitle>Game Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Total Games: {games.length}</p>
                  <p className="text-muted-foreground">Upcoming: {games.filter((g) => g.status === "upcoming").length}</p>
                  <p className="text-muted-foreground">Live: {games.filter((g) => g.status === "live").length}</p>
                  <p className="text-muted-foreground">Finished: {games.filter((g) => g.status === "finished").length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card hover-lift animate-fade-up-delay-3 glow-border transition-all duration-300">
                <CardHeader>
                  <CardTitle>Bet Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Total Bets: {totalBets}</p>
                  <p className="text-muted-foreground">Won: {bets.filter((b) => b.status === "won").length}</p>
                  <p className="text-muted-foreground">Lost: {bets.filter((b) => b.status === "lost").length}</p>
                  <p className="text-muted-foreground">Pending: {pendingBets}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Start Campaign for {selectedGameForCampaign?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign-dialog-start-date">Campaign Start Date</Label>
                <Popover open={campaignStartDateOpen} onOpenChange={setCampaignStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="campaign-dialog-start-date"
                      variant="outline"
                      className={`
                        w-full h-12 justify-start text-left font-normal
                        bg-secondary/20 border-border/60 hover:bg-secondary/30
                        focus:border-accent/60 focus-visible:ring-0 transition-colors
                        ${!campaignStartDate ? "text-muted-foreground" : "text-foreground"}
                      `}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {campaignStartDate ? format(campaignStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={campaignStartDate}
                      onSelect={(date) => {
                        setCampaignStartDate(date);
                        setCampaignStartDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="campaign-dialog-start-time">Campaign Start Time</Label>
                <Popover open={campaignStartTimeOpen} onOpenChange={setCampaignStartTimeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="campaign-dialog-start-time"
                      variant="outline"
                      className={`
                        w-full h-12 justify-start text-left font-normal
                        bg-secondary/20 border-border/60 hover:bg-secondary/30
                        focus:border-accent/60 focus-visible:ring-0 transition-colors
                        ${!campaignStartTime ? "text-muted-foreground" : "text-foreground"}
                      `}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {campaignStartTime ? formatTimeLabel(campaignStartTime) : <span>Select time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0 bg-popover border-border shadow-lg" align="start">
                    <div
                      className="max-h-64 overflow-y-auto py-2 custom-scrollbar"
                      style={{
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={(e) => {
                        e.currentTarget.scrollBy({
                          top: e.deltaY,
                          behavior: 'smooth'
                        });
                      }}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`
                            w-full px-4 py-2.5 text-left text-sm font-medium
                            transition-all duration-200
                            border-l-2 border-transparent
                            hover:bg-accent/10 hover:border-accent/50
                            hover:text-accent
                            active:bg-accent/20
                            ${campaignStartTime === option.value
                              ? "bg-accent/20 text-accent border-l-accent font-semibold"
                              : "text-foreground"
                            }
                          `}
                          onClick={() => {
                            setCampaignStartTime(option.value);
                            setCampaignStartTimeOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="campaign-dialog-end-date">Campaign End Date</Label>
                <Popover open={campaignEndDateOpen} onOpenChange={setCampaignEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="campaign-dialog-end-date"
                      variant="outline"
                      className={`
                        w-full h-12 justify-start text-left font-normal
                        bg-secondary/20 border-border/60 hover:bg-secondary/30
                        focus:border-accent/60 focus-visible:ring-0 transition-colors
                        ${!campaignEndDate ? "text-muted-foreground" : "text-foreground"}
                      `}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {campaignEndDate ? format(campaignEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={campaignEndDate}
                      onSelect={(date) => {
                        setCampaignEndDate(date);
                        setCampaignEndDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (campaignStartDate) {
                          const start = new Date(campaignStartDate);
                          start.setHours(0, 0, 0, 0);
                          return date < start;
                        }
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="campaign-dialog-end-time">Campaign End Time</Label>
                <Popover open={campaignEndTimeOpen} onOpenChange={setCampaignEndTimeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="campaign-dialog-end-time"
                      variant="outline"
                      className={`
                        w-full h-12 justify-start text-left font-normal
                        bg-secondary/20 border-border/60 hover:bg-secondary/30
                        focus:border-accent/60 focus-visible:ring-0 transition-colors
                        ${!campaignEndTime ? "text-muted-foreground" : "text-foreground"}
                      `}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {campaignEndTime ? formatTimeLabel(campaignEndTime) : <span>Select time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0 bg-popover border-border shadow-lg" align="start">
                    <div
                      ref={endTimeScrollRef}
                      className="max-h-64 overflow-y-auto py-2 custom-scrollbar"
                      style={{
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={(e) => {
                        e.currentTarget.scrollBy({
                          top: e.deltaY,
                          behavior: 'smooth'
                        });
                      }}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`
                            w-full px-4 py-2.5 text-left text-sm font-medium
                            transition-all duration-200
                            border-l-2 border-transparent
                            hover:bg-accent/10 hover:border-accent/50
                            hover:text-accent
                            active:bg-accent/20
                            ${campaignEndTime === option.value
                              ? "bg-accent/20 text-accent border-l-accent font-semibold"
                              : "text-foreground"
                            }
                          `}
                          onClick={() => {
                            setCampaignEndTime(option.value);
                            setCampaignEndTimeOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCampaignDialogOpen(false)}
              className="border-border text-foreground hover:bg-accent/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartCampaign}
              className="btn-gold gold-glow transition-all hover:scale-105"
            >
              Start Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Game Dialog */}
      <Dialog open={showGameForm} onOpenChange={setShowGameForm}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="game-title">Game Title</Label>
              <Input
                id="game-title"
                placeholder="Chiefs vs Bills"
                value={gameForm.title}
                onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                className="h-12 bg-secondary/20 border-border/60 focus:border-accent/60 focus-visible:ring-0 transition-colors text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="team1">Team 1</Label>
              <Input
                id="team1"
                placeholder="Kansas City Chiefs"
                value={gameForm.team1}
                onChange={(e) => setGameForm({ ...gameForm, team1: e.target.value })}
                className="h-12 bg-secondary/20 border-border/60 focus:border-accent/60 focus-visible:ring-0 transition-colors text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="team2">Team 2</Label>
              <Input
                id="team2"
                placeholder="Buffalo Bills"
                value={gameForm.team2}
                onChange={(e) => setGameForm({ ...gameForm, team2: e.target.value })}
                className="h-12 bg-secondary/20 border-border/60 focus:border-accent/60 focus-visible:ring-0 transition-colors text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGameForm(false);
                setGameForm({ title: "", team1: "", team2: "" });
              }}
              className="border-border/60 text-muted-foreground hover:border-border hover:bg-secondary/50 hover:text-foreground transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateGame}
              className="btn-gold gold-glow transition-all hover:scale-105"
            >
              Create Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

