import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  LogOut, 
  TrendingUp,
  TrendingDown,
  Trophy,
  DollarSign,
  Clock,
  Gamepad2,
  Sparkles,
  Zap,
  Bell,
  User,
  Home,
  Ticket,
  Banknote,
  CheckCircle,
  XCircle,
  Loader,
  ShieldCheck,
  ArrowUpRight,
  PlusCircle,
  ChevronRight,
  BarChart3
} from "lucide-react";

// Helper function to format date in 12-hour format without seconds
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return format(date, "MM/dd/yyyy, hh:mm a");
};

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'my-bets'>('live');
  const navigate = useNavigate();

  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(true);
  
  // Bet dialog state
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"team1" | "team2" | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [placingBet, setPlacingBet] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Redirect super_admin to admin dashboard
      const role = user?.user_metadata?.role;
      if (role === "super_admin") {
        navigate("/admin", { replace: true });
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role;
      if (role === "super_admin") {
        navigate("/admin", { replace: true });
        return;
      }
      setUser(session?.user || null);
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  // Load games from database
  useEffect(() => {
    const loadGames = async () => {
      setLoadingGames(true);
      const now = new Date();
      
      // Fetch all games that are upcoming or live
      const { data: gamesData, error } = await supabase
        .from("games")
        .select("*")
        .in("status", ["upcoming", "live"])
        .order("campaign_start_at", { ascending: true });

      if (error) {
        console.error("Error loading games:", error);
        setLoadingGames(false);
        return;
      }

      if (gamesData) {
        const upcoming: any[] = [];
        const live: any[] = [];

        gamesData.forEach((game) => {
          if (!game.campaign_start_at || !game.campaign_end_at) return;
          const start = new Date(game.campaign_start_at);
          const end = new Date(game.campaign_end_at);

          if (now < start) {
            upcoming.push(game);
          } else if (now >= start && now <= end) {
            live.push(game);
          }
          // if now > end, campaign is over – don't show in Available Games
        });

        setLiveGames(live);
        setUpcomingGames(upcoming);
      }
      setLoadingGames(false);
    };

    loadGames();
    
    // Refresh games every 30 seconds
    const interval = setInterval(loadGames, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load current user's bets (for showing past games and hiding bet buttons)
  useEffect(() => {
    const loadUserBets = async () => {
      if (!user) return;
      setLoadingBets(true);

      const userId = user.user_metadata?.user_id;
      if (!userId) {
        setUserBets([]);
        setLoadingBets(false);
        return;
      }

      const { data, error } = await supabase
        .from("bets")
        .select(`
          *,
          games (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading user bets:", error);
        setLoadingBets(false);
        return;
      }

      setUserBets(data || []);
      setLoadingBets(false);
    };

    loadUserBets();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const handleBet = (gameId: number, team: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const allGames = [...liveGames, ...upcomingGames];
    const game = allGames.find((g) => g.id === gameId);
    if (!game) {
      console.error("Game not found:", gameId);
      return;
    }

    // Check if campaign window is still valid
    const now = new Date();
    if (game.campaign_start_at && game.campaign_end_at) {
      const start = new Date(game.campaign_start_at);
      const end = new Date(game.campaign_end_at);
      if (now < start || now > end) {
        toast.error("Betting is closed for this game. The campaign window has ended.");
        return;
      }
    }

    setSelectedGame(game);
    setSelectedTeam(team === game.team1 ? "team1" : "team2");
    setBetAmount("");
    setBetDialogOpen(true);
  };

  const confirmBet = async () => {
    if (!selectedGame || !selectedTeam || !user) return;

    // Validate bet amount
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bet amount greater than 0");
      return;
    }

    // Check campaign window one more time
    const now = new Date();
    if (selectedGame.campaign_start_at && selectedGame.campaign_end_at) {
      const start = new Date(selectedGame.campaign_start_at);
      const end = new Date(selectedGame.campaign_end_at);
      if (now < start || now > end) {
        toast.error("Betting is closed for this game. The campaign window has ended.");
        setBetDialogOpen(false);
        return;
      }
    }

    setPlacingBet(true);

    const userId = user.user_metadata?.user_id;
    if (!userId) {
      toast.error("User ID not found. Please sign in again.");
      setPlacingBet(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bets")
        .insert({
          user_id: userId,
          game_id: selectedGame.id,
          bet_on: selectedTeam,
          amount: amount,
          status: "pending",
          payout: null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error placing bet:", error);
        toast.error(`Failed to place bet: ${error.message}`);
        setPlacingBet(false);
        return;
      }

      toast.success(`Bet placed successfully! You bet $${amount.toFixed(2)} on ${selectedTeam === "team1" ? selectedGame.team1 : selectedGame.team2}`);
      setBetDialogOpen(false);
      setBetAmount("");
      setSelectedGame(null);
      setSelectedTeam(null);

      // Reload user bets to update the UI
      const { data: betsData, error: betsError } = await supabase
        .from("bets")
        .select(`
          *,
          games (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!betsError && betsData) {
        setUserBets(betsData);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setPlacingBet(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    // ProtectedRoute handles redirecting unauthenticated users.
    return null;
  }

  // Map of gameId -> aggregated bet info for this user
  const userBetsByGame = userBets.reduce((acc: Record<number, { totalAmount: number; status: string; payout: number | null }>, bet: any) => {
    const existing = acc[bet.game_id];
    if (existing) {
      existing.totalAmount += Number(bet.amount);
      // Prefer "won" over "lost" over "pending"
      const statusPriority: Record<string, number> = { won: 3, lost: 2, pending: 1 };
      if ((statusPriority[bet.status] || 0) > (statusPriority[existing.status] || 0)) {
        existing.status = bet.status;
        existing.payout = bet.payout;
      }
    } else {
      acc[bet.game_id] = {
        totalAmount: Number(bet.amount),
        status: bet.status,
        payout: bet.payout,
      };
    }
    return acc;
  }, {});

  // Calculate dynamic stats from userBets
  const totalBets = userBets.length;
  const wonBets = userBets.filter((bet: any) => bet.status === "won");
  const lostBets = userBets.filter((bet: any) => bet.status === "lost");
  const settledBets = wonBets.length + lostBets.length;
  const winRate = settledBets > 0 ? ((wonBets.length / settledBets) * 100).toFixed(1) : "0.0";
  const totalWon = wonBets.reduce((sum: number, bet: any) => sum + (Number(bet.payout) || 0), 0);
  const totalLost = lostBets.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0);
  const netProfit = totalWon - totalLost;
  const totalStaked = userBets.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0);
  const averageStake = totalBets > 0 ? totalStaked / totalBets : 0;
  
  // Calculate dynamic balance based on actual bet activity
  // Starting balance: use user metadata if set, otherwise default to $0.00
  // (We don't want to show "fake" money for users who never deposited / never bet.)
  const startingBalanceRaw = user.user_metadata?.starting_balance;
  const startingBalance = Number(startingBalanceRaw ?? 0) || 0;
  
  // Calculate available balance:
  // Starting balance + Total payouts received - Total amount staked (including pending bets)
  // This represents the actual money available to the user
  const totalPayoutsReceived = wonBets.reduce((sum: number, bet: any) => sum + (Number(bet.payout) || 0), 0);
  const totalAmountStaked = userBets.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0);
  
  // Available balance = Starting balance + Winnings - All bets placed
  // When a bet is placed, money is deducted. When a bet wins, payout is added back.
  const availableBalance = startingBalance + totalPayoutsReceived - totalAmountStaked;
  
  // Display balance (ensure it doesn't go negative for display, but allow negative for calculation)
  const displayBalance = Math.max(0, availableBalance);
  
  // Get biggest win and loss
  const biggestWin = wonBets.length > 0 
    ? wonBets.reduce((max: any, bet: any) => (Number(bet.payout) || 0) > (Number(max.payout) || 0) ? bet : max, wonBets[0])
    : null;
  const biggestLoss = lostBets.length > 0
    ? lostBets.reduce((max: any, bet: any) => Number(bet.amount) > Number(max.amount) ? bet : max, lostBets[0])
    : null;
  

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
                onClick={() => setActiveTab('live')}
                className={`text-sm transition-colors border-b-2 border-transparent hover:border-accent pb-1 ${
                  activeTab === 'live' ? 'text-accent border-accent' : 'text-accent/80 hover:text-accent'
                }`}
              >
                Games
              </button>
              <button 
                onClick={() => setActiveTab('my-bets')}
                className={`text-sm transition-colors border-b-2 border-transparent hover:border-accent pb-1 ${
                  activeTab === 'my-bets' ? 'text-accent border-accent' : 'text-accent/80 hover:text-accent'
                }`}
              >
                History
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground">
                  <User className="w-4 h-4" />
              </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-foreground">{user.user_metadata?.name || user.user_metadata?.username || 'Player'}</div>
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
        
        {/* Hero: Balance Display */}
        <section className="mb-8 animate-fade-up">
          <Card className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative border-accent/20 bg-card hover-lift glow-border-gold shadow-[0_0_30px_rgba(255,215,0,0.08)]">
            {/* Decorative Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-1">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-foreground">${displayBalance.toFixed(2)}</span>
                {netProfit > 0 && totalStaked > 0 && (
                  <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{((netProfit / totalStaked) * 100).toFixed(1)}%
                  </span>
                )}
                {netProfit < 0 && totalStaked > 0 && (
                  <span className="text-red-400 text-sm font-semibold flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {((netProfit / totalStaked) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  Verified Account
                </span>
                {userBets.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last bet {format(new Date(userBets[0].created_at), "MMM dd")}
                  </span>
                )}
        </div>
      </div>

            <div className="flex items-center gap-3 relative z-10">
              <Button 
                variant="outline"
                className="px-6 py-3 rounded-xl border-accent/30 text-foreground hover:bg-accent/10 hover:border-accent hover:text-accent transition-all hover:scale-105 flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw</span>
              </Button>
        </div>
          </Card>
        </section>

        {/* Summary Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Bets */}
          <Card className="p-5 border-border bg-card hover-lift animate-fade-up-delay-1 glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
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

          {/* Total Wins */}
          <Card className="p-5 border-border bg-card hover-lift animate-fade-up-delay-1 glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded uppercase">Performance</span>
                </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Wins</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-foreground">{wonBets.length}</p>
                {settledBets > 0 && (
                  <span className="text-green-400 text-xs font-medium">↑ {winRate}%</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Losses */}
          <Card className="p-5 border-border bg-card hover-lift animate-fade-up-delay-1 glow-border transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded uppercase">Risk</span>
                </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Losses</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-foreground">{lostBets.length}</p>
                {lostBets.length > 0 && (
                  <span className="text-red-400 text-xs font-medium">↓ {((lostBets.length / settledBets) * 100).toFixed(1)}%</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Net Profit/Loss */}
          <Card className="p-5 border-accent/30 bg-card hover-lift animate-fade-up-delay-1 shadow-[0_0_20px_rgba(255,215,0,0.05)] glow-border-gold transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Banknote className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${netProfit > 0 ? 'text-green-400 bg-green-500/10' : 'text-muted-foreground bg-secondary'}`}>
                  {netProfit > 0 ? 'Profit' : 'Loss'}
                </span>
                </div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Net Profit</h3>
              <div className="flex items-baseline justify-between mt-1">
                <p className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-400' : netProfit < 0 ? 'text-red-400' : 'text-foreground'}`}>
                  {netProfit > 0 ? '+' : ''}${netProfit.toFixed(2)}
                </p>
                {netProfit > 0 && (
                  <span className="text-green-400 text-xs font-medium">↑ {winRate}%</span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Games Section with Tabs */}
        <div className="space-y-6 animate-fade-up-delay-2">
          <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Available Games</h3>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('live')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'live' 
                  ? 'text-accent' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'live' ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
                Live Games
              </div>
              {activeTab === 'live' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'upcoming' 
                  ? 'text-accent' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming
              </div>
              {activeTab === 'upcoming' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
              )}
            </button>
                <button
                  onClick={() => setActiveTab('my-bets')}
                  className={`pb-3 px-1 font-medium transition-colors relative ${
                    activeTab === 'my-bets' 
                      ? 'text-accent' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    My Bets
                  </div>
                  {activeTab === 'my-bets' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
                  )}
                </button>
          </div>

          {/* Games List */}
          <div className="space-y-8">
            {!loadingGames && activeTab === 'live' && liveGames.length === 0 && (
              <Card className="border-border/60 bg-card">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No live games available at the moment.</p>
                </CardContent>
              </Card>
            )}
            {activeTab === 'live' && liveGames.map((game) => {
              const userBet = userBetsByGame[game.id];
              return (
              <Card key={game.id} className="overflow-hidden border-border/50 hover:border-accent/30 hover-lift bg-card animate-fade-up-delay-3 glow-border transition-all duration-300">
                <CardContent className="p-0">
                  {/* Game Header */}
                  <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400 font-medium">LIVE</span>
                        <span className="text-muted-foreground text-sm">
                          {game.campaign_end_at 
                            ? `Ends: ${formatDateTime(game.campaign_end_at)}`
                            : "Live Now"}
                        </span>
                      </div>
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        {game.league}
                      </Badge>
                    </div>
                  </div>

                  {/* Teams and Scores */}
                  <div className="p-6 relative z-10">
                    <div className="grid grid-cols-3 gap-8 items-center">
                      {/* Team 1 */}
                      <div className="text-center relative z-10">
                        <h3 className="text-lg font-semibold mb-2">{game.team1}</h3>
                        <div className="space-y-3">
                          {userBet && (
                            <div className="text-xs text-accent mb-2 space-y-1 p-2 rounded bg-accent/10 border border-accent/20">
                              <div>Your bets: ${userBet.totalAmount.toFixed(2)}</div>
                              <div>Status: <span className={userBet.status === "won" ? "text-green-400" : userBet.status === "lost" ? "text-red-400" : "text-yellow-400"}>{userBet.status}</span></div>
                              {userBet.payout !== null && <div>Payout: ${userBet.payout.toFixed(2)}</div>}
                            </div>
                          )}
                          <Button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBet(game.id, game.team1, e);
                            }}
                            className="w-full btn-gold gold-glow font-semibold transition-all hover:scale-105 cursor-pointer relative z-20"
                            type="button"
                            disabled={false}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {userBet ? "Bet Again" : "Bet Now"}
                          </Button>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="text-center">
                        <div className="text-muted-foreground font-bold text-xl">VS</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {game.campaign_end_at 
                            ? `Betting ends: ${formatDateTime(game.campaign_end_at)}`
                            : "Live"}
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="text-center relative z-10">
                        <h3 className="text-lg font-semibold mb-2">{game.team2}</h3>
                        <div className="space-y-3">
                          {userBet && (
                            <div className="text-xs text-accent mb-2 space-y-1 p-2 rounded bg-accent/10 border border-accent/20">
                              <div>Your bets: ${userBet.totalAmount.toFixed(2)}</div>
                              <div>Status: <span className={userBet.status === "won" ? "text-green-400" : userBet.status === "lost" ? "text-red-400" : "text-yellow-400"}>{userBet.status}</span></div>
                              {userBet.payout !== null && <div>Payout: ${userBet.payout.toFixed(2)}</div>}
                            </div>
                          )}
                          <Button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBet(game.id, game.team2, e);
                            }}
                            className="w-full btn-gold gold-glow font-semibold transition-all hover:scale-105 cursor-pointer relative z-20"
                            type="button"
                            disabled={false}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {userBet ? "Bet Again" : "Bet Now"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}

            {!loadingGames && activeTab === 'upcoming' && upcomingGames.length === 0 && (
              <Card className="border-border/60 bg-card">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No upcoming games available at the moment.</p>
                </CardContent>
              </Card>
            )}
            {!loadingGames && activeTab === 'upcoming' && upcomingGames.map((game) => {
              const userBet = userBetsByGame[game.id];
              return (
              <Card key={game.id} className="border-border/60 hover:border-accent/30 transition-all hover-lift bg-card glow-border animate-fade-up-delay-3">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-accent/20 text-accent border-accent/30">
                      {game.league}
                    </Badge>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                      {game.campaign_start_at 
                          ? `Starts: ${formatDateTime(game.campaign_start_at)}`
                        : "Upcoming"}
                        {game.campaign_end_at && (
                          <> • Ends: ${formatDateTime(game.campaign_end_at)}</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 items-center">
                    {/* Team 1 */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">{game.team1}</h3>
                      {userBet && (
                        <div className="text-xs text-accent mb-2 space-y-1 p-2 rounded bg-accent/10 border border-accent/20">
                          <div>Your bets: ${userBet.totalAmount.toFixed(2)}</div>
                          <div>Status: <span className={userBet.status === "won" ? "text-green-400" : userBet.status === "lost" ? "text-red-400" : "text-yellow-400"}>{userBet.status}</span></div>
                          {userBet.payout !== null && <div>Payout: ${userBet.payout.toFixed(2)}</div>}
                        </div>
                      )}
                      <Button 
                        onClick={() => handleBet(game.id, game.team1)}
                        variant="outline"
                        disabled={true}
                        className="w-full border-border text-muted-foreground opacity-50 cursor-not-allowed"
                      >
                        Bet (Campaign Not Started)
                      </Button>
                    </div>

                    {/* VS */}
                    <div className="text-center">
                      <div className="text-muted-foreground font-bold text-xl">VS</div>
                    </div>

                    {/* Team 2 */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">{game.team2}</h3>
                      {userBet && (
                        <div className="text-xs text-accent mb-2 space-y-1 p-2 rounded bg-accent/10 border border-accent/20">
                          <div>Your bets: ${userBet.totalAmount.toFixed(2)}</div>
                          <div>Status: <span className={userBet.status === "won" ? "text-green-400" : userBet.status === "lost" ? "text-red-400" : "text-yellow-400"}>{userBet.status}</span></div>
                          {userBet.payout !== null && <div>Payout: ${userBet.payout.toFixed(2)}</div>}
                        </div>
                      )}
                      <Button 
                        onClick={() => handleBet(game.id, game.team2)}
                        variant="outline"
                        disabled={true}
                        className="w-full border-border text-muted-foreground opacity-50 cursor-not-allowed"
                      >
                        Bet (Campaign Not Started)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}

            {activeTab === 'my-bets' && (
              <div className="space-y-4">
                {!loadingBets && userBets.length === 0 && (
                  <Card className="border-border/60 bg-card">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">You haven't placed any bets yet.</p>
                    </CardContent>
                  </Card>
                )}
                {!loadingBets && userBets.length > 0 && (
                  <>
                    {userBets.map((bet) => {
                      const now = new Date();
                      const campaignEnded = bet.games?.campaign_end_at 
                        ? new Date(bet.games.campaign_end_at) < now 
                        : false;
                      return (
                      <Card key={bet.id} className="border-border/60 bg-card hover-lift animate-fade-up-delay-2 glow-border transition-all duration-300">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <p className="font-semibold">{bet.games?.title || `Game #${bet.game_id}`}</p>
                            <p className="text-sm text-muted-foreground">
                              You bet on: {bet.bet_on === "team1" ? bet.games?.team1 : bet.games?.team2}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Placed at: {formatDateTime(bet.created_at)}
                            </p>
                            {bet.games?.campaign_end_at && (
                              <p className="text-xs text-muted-foreground">
                                Campaign ended: {formatDateTime(bet.games.campaign_end_at)}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm text-accent">Amount: ${Number(bet.amount).toFixed(2)}</div>
                            <div className="text-sm">
                              Status:{" "}
                              <span
                                className={
                                  bet.status === "won"
                                    ? "text-green-400"
                                    : bet.status === "lost"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                                }
                              >
                                {bet.status}
                              </span>
                            </div>
                            {bet.payout !== null && (
                              <div className="text-sm text-accent">Payout: ${Number(bet.payout).toFixed(2)}</div>
                            )}
                            {campaignEnded && bet.status === "pending" && (
                              <div className="text-xs text-muted-foreground">Awaiting result</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )})}
                  </>
                )}
              </div>
            )}
            </div>
        </div>
      </main>

      {/* Place Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to bet on {selectedGame && selectedTeam ? (selectedTeam === "team1" ? selectedGame.team1 : selectedGame.team2) : ""}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGame && selectedTeam && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-secondary/20 border border-border/60">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Game:</span>
                    <span className="font-semibold">{selectedGame.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Team:</span>
                    <span className="font-semibold text-accent">
                      {selectedTeam === "team1" ? selectedGame.team1 : selectedGame.team2}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bet-amount">Bet Amount ($)</Label>
                <Input
                  id="bet-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={betAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                      setBetAmount(value);
                    }
                  }}
                  className="h-12 bg-secondary/20 border-border/60 focus:border-accent/60 focus-visible:ring-0 transition-colors text-foreground"
                  disabled={placingBet}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum bet: $0.01
                </p>
              </div>

              {betAmount && !isNaN(parseFloat(betAmount)) && parseFloat(betAmount) > 0 && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bet Amount:</span>
                      <span className="font-semibold">${parseFloat(betAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Potential Payout:</span>
                      <span className="font-semibold text-accent">
                        ${(parseFloat(betAmount) * 1.5).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/60">
                      * Payout is calculated at 1.5x your bet amount if you win
          </div>
        </div>
      </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBetDialogOpen(false);
                setBetAmount("");
                setSelectedGame(null);
                setSelectedTeam(null);
              }}
              className="border-border text-foreground hover:bg-accent/10"
              disabled={placingBet}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBet}
              className="btn-gold gold-glow transition-all hover:scale-105"
              disabled={placingBet || !betAmount || isNaN(parseFloat(betAmount)) || parseFloat(betAmount) <= 0}
            >
              {placingBet ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                  Placing Bet...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Confirm Bet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
