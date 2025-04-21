/**
 * Trade Evaluator Page
 * 
 * This page allows users to evaluate potential trades between their team and other teams in the league.
 * It calculates the total points from the previous season and projected points for the upcoming season
 * to help users make informed trading decisions.
 * 
 * Key features:
 * - Select players from your roster to include in a trade
 * - Choose another team from your league
 * - Select players from the other team to include in the trade
 * - View total points comparison between both sides
 * - See projected points comparison for the upcoming season
 */

/** @jsxImportSource react */
import React from 'react';
import { useRouter } from 'next/router';
import type { SleeperRoster, SleeperUser, SleeperPlayer, SleeperDraftPick } from '../types/sleeper';
import type { PlayerStats } from '../types/player';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league/LeagueContext';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

interface TradePlayer extends SleeperPlayer {
  pts_ppr?: number;
  pts_std?: number;
  projected_pts?: number;
}

interface SimpleDraftPick {
  season: string;
  round: number;
  pick_no: number;
}

interface TradeSide {
  players: TradePlayer[];
  draftPicks: SimpleDraftPick[];
  totalProjectedPoints: number;
  totalPoints: number;
}

const TradeEvaluator: React.FC = () => {
  const { user } = useAuth();
  const { currentLeague, users, draftPicks } = useLeague();
  const { players } = usePlayer();
  const { rosters } = useRoster();
  const router = useRouter();
  const [myTeam, setMyTeam] = React.useState<string>('');
  const [theirTeam, setTheirTeam] = React.useState<string>('');
  const [selectedTeam, setSelectedTeam] = React.useState<string>('');

  const [mySide, setMySide] = React.useState<TradeSide>({
    players: [],
    draftPicks: [],
    totalProjectedPoints: 0,
    totalPoints: 0
  });

  const [theirSide, setTheirSide] = React.useState<TradeSide>({
    players: [],
    draftPicks: [],
    totalProjectedPoints: 0,
    totalPoints: 0
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTeamRoster, setSelectedTeamRoster] = React.useState<SleeperRoster | null>(null);

  // Check if we have the necessary data, redirect if not
  React.useEffect(() => {
    // If we don't have rosters or players data, show loading state
    if ((!rosters || rosters.length === 0) || !players || Object.keys(players).length === 0) {
      console.log('Trade Evaluator page: Waiting for data...', {
        hasRosters: !!rosters && rosters.length > 0,
        hasPlayers: !!players && Object.keys(players).length > 0
      });
      setIsLoading(true);
      return;
    }
    
    // If we have the data, we're no longer loading
    setIsLoading(false);
  }, [rosters, players]);

  const currentRoster = React.useMemo(() => {
    if (!user || !rosters) return null;
    return rosters.find((r: SleeperRoster) => r.owner_id === user.user_id);
  }, [user, rosters]);

  const availablePlayers = React.useMemo(() => {
    const currentRoster = rosters.find((r: SleeperRoster) => r.roster_id === selectedTeam);
    if (!currentRoster) return [];
    
    const playersArray = Object.values(players) as SleeperPlayer[];
    const filteredPlayers = playersArray.filter((p: SleeperPlayer) => 
      currentRoster.players.includes(p.player_id) && 
      !mySide.players.some((tp: TradePlayer) => tp.player_id === p.player_id) &&
      !theirSide.players.some((tp: TradePlayer) => tp.player_id === p.player_id)
    );
    
    return filteredPlayers.map((p: SleeperPlayer) => ({
      ...p,
      pts_ppr: p.pts_ppr || 0,
      pts_std: (p.stats?.pts_standard || 0),
      projected_pts: p.projected_pts || 0
    }));
  }, [rosters, selectedTeam, players, mySide.players, theirSide.players]);

  const selectedTeamPlayers = React.useMemo(() => {
    const currentRoster = rosters.find((r: SleeperRoster) => r.roster_id === selectedTeam);
    if (!currentRoster) return [];
    
    const playersArray = Object.values(players) as SleeperPlayer[];
    const filteredPlayers = playersArray.filter((p: SleeperPlayer) => 
      currentRoster.players.includes(p.player_id) && 
      !mySide.players.some((tp: TradePlayer) => tp.player_id === p.player_id) &&
      !theirSide.players.some((tp: TradePlayer) => tp.player_id === p.player_id)
    );
    
    return filteredPlayers.map((p: SleeperPlayer) => ({
      ...p,
      pts_ppr: p.pts_ppr || 0,
      pts_std: (p.stats?.pts_standard || 0),
      projected_pts: p.projected_pts || 0
    }));
  }, [rosters, selectedTeam, players, mySide.players, theirSide.players]);

  const handleAddPlayer = (player: SleeperPlayer, side: 'my' | 'their') => {
    const tradePlayer: TradePlayer = {
      ...player,
      pts_ppr: player.pts_ppr || 0,
      pts_std: 0
    };

    if (side === 'my') {
      setMySide((prev: TradeSide) => ({
        ...prev,
        players: [...prev.players, tradePlayer]
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        players: [...prev.players, tradePlayer]
      }));
    }
  };

  const handleRemovePlayer = (playerId: string, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide((prev: TradeSide) => ({
        ...prev,
        players: prev.players.filter((p: TradePlayer) => p.player_id !== playerId)
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        players: prev.players.filter((p: TradePlayer) => p.player_id !== playerId)
      }));
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>, side: 'my' | 'their') => {
    const teamId = e.target.value;
    if (side === 'my') {
      setSelectedTeam(teamId);
      setMySide((prev: TradeSide) => ({ ...prev, players: [] }));
    } else {
      setSelectedTeam(teamId);
      setTheirSide((prev: TradeSide) => ({ ...prev, players: [] }));
    }
    
    // Find the selected team's roster
    const teamRoster = rosters?.find((r: SleeperRoster) => r.roster_id === teamId);
    setSelectedTeamRoster(teamRoster || null);
  };

  const handleMyTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleTeamChange(e, 'my');
  };

  const handleTheirTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleTeamChange(e, 'their');
  };

  const handleAddDraftPick = (pick: SimpleDraftPick, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide((prev: TradeSide) => ({
        ...prev,
        draftPicks: [...prev.draftPicks, pick]
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        draftPicks: [...prev.draftPicks, pick]
      }));
    }
  };

  const handleRemoveDraftPick = (pick: SimpleDraftPick) => {
    if (selectedTeam === myTeam) {
      setMySide((prev: TradeSide) => ({
        ...prev,
        draftPicks: prev.draftPicks.filter((p: SimpleDraftPick) => 
          p.season !== pick.season || p.round !== pick.round || p.pick_no !== pick.pick_no
        )
      }));
    } else {
      setTheirSide((prev: TradeSide) => ({
        ...prev,
        draftPicks: prev.draftPicks.filter((p: SimpleDraftPick) => 
          p.season !== pick.season || p.round !== pick.round || p.pick_no !== pick.pick_no
        )
      }));
    }
  };

  const mySideStats: TradeSide = {
    players: mySide.players,
    draftPicks: mySide.draftPicks,
    totalProjectedPoints: mySide.players.reduce((sum: number, p: TradePlayer) => {
      const projectedPoints = p.stats?.projected_pts || 0;
      return sum + projectedPoints;
    }, 0),
    totalPoints: mySide.players.reduce((sum: number, p: TradePlayer) => sum + (p.pts_ppr || 0), 0)
  };

  const theirSideStats: TradeSide = {
    players: theirSide.players,
    draftPicks: theirSide.draftPicks,
    totalProjectedPoints: theirSide.players.reduce((sum: number, p: TradePlayer) => {
      const projectedPoints = p.stats?.projected_pts || 0;
      return sum + projectedPoints;
    }, 0),
    totalPoints: theirSide.players.reduce((sum: number, p: TradePlayer) => sum + (p.pts_ppr || 0), 0)
  };

  const getPlayerValue = (player: SleeperPlayer): number => {
    if (!player) return 0;
    return player.projected_pts || player.pts_ppr || 0;
  };

  const getTradeValue = (side: TradeSide) => {
    const playerValue = side.players.reduce((total, p) => {
      return total + (p.projected_pts || 0) + (p.pts_ppr || 0);
    }, 0);

    const pickValue = side.draftPicks.reduce((total, pick) => {
      // Higher round picks are worth more
      const roundValue = (12 - pick.round) * 100;
      return total + roundValue;
    }, 0);

    return playerValue + pickValue;
  };

  // Show loading state if data is not available
  if (isLoading || !currentRoster) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading trade evaluator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Trade Evaluator</h1>
      
      {/* Trade Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* My Side */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">
            My Side {currentRoster && (
              <span className="text-gray-600">
                - {currentRoster.metadata?.team_name || 
                  users.find((user: SleeperUser) => user.user_id === currentRoster.owner_id)?.display_name || 
                  users.find((user: SleeperUser) => user.user_id === currentRoster.owner_id)?.username || 
                  `Team ${currentRoster.roster_id}`}
              </span>
            )}
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Players</h3>
              <div className="space-y-2">
                {mySide.players.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex justify-between items-center">
                    <span>{player.full_name} ({player.position})</span>
                    <button
                      onClick={() => handleRemovePlayer(player.player_id, 'my')}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Draft Picks</h3>
              <div className="space-y-2">
                {mySide.draftPicks.map((pick: SimpleDraftPick, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{pick.season} Round {pick.round} Pick {pick.pick_no}</span>
                    <button
                      onClick={() => handleRemoveDraftPick(pick)}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t">
              <p>Total Projected Points: {mySideStats.totalProjectedPoints.toFixed(2)}</p>
              <p>Total Points: {mySideStats.totalPoints.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Their Side */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Select Team to Trade With</h2>
          <select
            className="w-full p-2 border rounded"
            value={selectedTeam}
            onChange={handleTheirTeamChange}
          >
            <option value="">Select a team</option>
            {rosters
              .filter((r: SleeperRoster) => r.owner_id !== user?.user_id)
              .map((team: SleeperRoster) => {
                const teamUser = users.find((u: SleeperUser) => u.user_id === team.owner_id);
                return (
                  <option key={team.roster_id} value={team.roster_id}>
                    {teamUser?.display_name || teamUser?.username || `Team ${team.roster_id}`}
                  </option>
                );
              })}
          </select>

          {selectedTeamRoster && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Players</h3>
                <div className="space-y-2">
                  {theirSide.players.map((player: TradePlayer) => (
                    <div key={player.player_id} className="flex justify-between items-center">
                      <span>{player.full_name} ({player.position})</span>
                      <button
                        onClick={() => handleRemovePlayer(player.player_id, 'their')}
                        className="text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Draft Picks</h3>
                <div className="space-y-2">
                  {theirSide.draftPicks.map((pick: SimpleDraftPick, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{pick.season} Round {pick.round} Pick {pick.pick_no}</span>
                      <button
                        onClick={() => handleRemoveDraftPick(pick)}
                        className="text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <p>Total Projected Points: {theirSideStats.totalProjectedPoints.toFixed(2)}</p>
                <p>Total Points: {theirSideStats.totalPoints.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Players */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">My Players</h2>
          <div className="space-y-2">
            {availablePlayers.map((player: TradePlayer) => (
              <div key={player.player_id} className="flex justify-between items-center">
                <span>{player.full_name} ({player.position})</span>
                <button
                  onClick={() => handleAddPlayer(player, 'my')}
                  className="text-blue-500"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
          {draftPicks.filter((pick: SleeperDraftPick) => pick.roster_id === currentRoster?.roster_id).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">My Draft Picks</h3>
              <div className="space-y-2">
                {draftPicks
                  .filter((pick: SleeperDraftPick) => pick.roster_id === currentRoster?.roster_id)
                  .filter((pick: SleeperDraftPick) => {
                    const isInMySide = mySide.draftPicks.some((p: SimpleDraftPick) => 
                      p.season === pick.season && p.round === pick.round && p.pick_no === pick.pick_no
                    );
                    const isInTheirSide = theirSide.draftPicks.some((p: SimpleDraftPick) => 
                      p.season === pick.season && p.round === pick.round && p.pick_no === pick.pick_no
                    );
                    return !isInMySide && !isInTheirSide;
                  })
                  .map((pick: SleeperDraftPick, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{pick.season} Round {pick.round} Pick {pick.pick_no}</span>
                      <button
                        onClick={() => handleAddDraftPick(pick, 'my')}
                        className="text-blue-500"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Their Players */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Their Players</h2>
          {selectedTeamRoster ? (
            <>
              <div className="space-y-2">
                {selectedTeamPlayers.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex justify-between items-center">
                    <span>{player.full_name} ({player.position})</span>
                    <button
                      onClick={() => handleAddPlayer(player, 'their')}
                      className="text-blue-500"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
              {selectedTeamRoster?.draft_picks && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-2">Their Draft Picks</h3>
                  <div className="space-y-2">
                    {selectedTeamRoster.draft_picks
                      .filter((pick: SimpleDraftPick) => {
                        const isInMySide = mySide.draftPicks.some((p: SimpleDraftPick) => 
                          p.season === pick.season && p.round === pick.round && p.pick_no === pick.pick_no
                        );
                        const isInTheirSide = theirSide.draftPicks.some((p: SimpleDraftPick) => 
                          p.season === pick.season && p.round === pick.round && p.pick_no === pick.pick_no
                        );
                        return !isInMySide && !isInTheirSide;
                      })
                      .map((pick: SimpleDraftPick, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{pick.season} Round {pick.round} Pick {pick.pick_no}</span>
                          <button
                            onClick={() => handleAddDraftPick(pick, 'their')}
                            className="text-blue-500"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Please select a team to trade with from the dropdown above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeEvaluator; 