# Manual Code Update Required

## File: `src/pages/AdminDashboard.tsx`

### Location: Lines 361-384

### Current Code (REMOVE THIS):
```tsx
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
```

### Replace With (NEW CODE):
```tsx
        if (won) {
          // Simple payout: 1.5x the bet amount
          const betAmount = Number(bet.amount);
          payout = betAmount * 1.5;
          wonBetsCount++;
          totalPayout += payout;
        }
```

## Why This Change?

Since you removed the `odds1` and `odds2` columns from the database, the code trying to access `gameData.odds1` and `gameData.odds2` will fail. This simplified version uses a fixed 1.5x multiplier for all winning bets.

## Example:
- User bets $100 and wins → Gets $150 payout
- User bets $50 and wins → Gets $75 payout
