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
import type { SleeperRoster, SleeperUser } from '../types/sleeper';
import type { PlayerStats } from '../types/player';
import { useAuth } from '../contexts/auth';
import { useLeague } from '../contexts/league';
import { usePlayer } from '../contexts/player';
import { useRoster } from '../contexts/roster';

interface TradePlayer {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
  projected_pts: number;
  pts_ppr: number;
  stats: PlayerStats;
}

interface TradeSide {
  players: TradePlayer[];
  draftPicks: {season: string; round: number; pick: number}[];
  totalProjectedPoints: number;
  totalPoints: number;
}

export default function TradeEvaluator() {
  const { user } = useAuth();
  const { currentLeague, users } = useLeague();
  const { players } = usePlayer();
  const { rosters } = useRoster();
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = React.useState<string>('');
  const [mySide, setMySide] = React.useState<TradePlayer[]>([]);
  const [theirSide, setTheirSide] = React.useState<TradePlayer[]>([]);
  const [myDraftPicks, setMyDraftPicks] = React.useState<{season: string; round: number; pick: number}[]>([]);
  const [theirDraftPicks, setTheirDraftPicks] = React.useState<{season: string; round: number; pick: number}[]>([]);
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
    if (!currentRoster || !players) return [];
    
    // Get all players from the roster
    const rosterPlayers = [
      ...(currentRoster.starters || []),
      ...(currentRoster.reserves || []),
      ...(currentRoster.taxi || []),
      ...(currentRoster.ir || [])
    ];

    // Filter out players that are already in the trade
    return rosterPlayers
      .filter((p: string) => !mySide.some((mp: TradePlayer) => mp.player_id === p))
      .filter((p: string) => !theirSide.some((tp: TradePlayer) => tp.player_id === p))
      .map((p: string) => {
        const player = players[p];
        if (!player) return null;
        return {
          player_id: player.player_id,
          full_name: player.full_name,
          position: player.position,
          team: player.team,
          projected_pts: player.projected_pts || 0,
          pts_ppr: player.pts_ppr || 0,
          stats: player.stats || {}
        };
      })
      .filter((p: TradePlayer | null): p is TradePlayer => p !== null);
  }, [currentRoster, players, mySide, theirSide]);

  const selectedTeamPlayers = React.useMemo(() => {
    if (!selectedTeamRoster || !players) return [];
    
    // Get all players from the selected team's roster
    const rosterPlayers = [
      ...(selectedTeamRoster.starters || []),
      ...(selectedTeamRoster.reserves || []),
      ...(selectedTeamRoster.taxi || []),
      ...(selectedTeamRoster.ir || [])
    ];

    // Filter out players that are already in the trade
    return rosterPlayers
      .filter((p: string) => !mySide.some((mp: TradePlayer) => mp.player_id === p))
      .filter((p: string) => !theirSide.some((tp: TradePlayer) => tp.player_id === p))
      .map((p: string) => {
        const player = players[p];
        if (!player) return null;
        return {
          player_id: player.player_id,
          full_name: player.full_name,
          position: player.position,
          team: player.team,
          projected_pts: player.projected_pts || 0,
          pts_ppr: player.pts_ppr || 0,
          stats: player.stats || {}
        };
      })
      .filter((p: TradePlayer | null): p is TradePlayer => p !== null);
  }, [selectedTeamRoster, players, mySide, theirSide]);

  const handleAddPlayer = (player: TradePlayer, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide([...mySide, player]);
    } else {
      setTheirSide([...theirSide, player]);
    }
  };

  const handleRemovePlayer = (player: TradePlayer, side: 'my' | 'their') => {
    if (side === 'my') {
      setMySide(mySide.filter((p: TradePlayer) => p.player_id !== player.player_id));
    } else {
      setTheirSide(theirSide.filter((p: TradePlayer) => p.player_id !== player.player_id));
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value;
    setSelectedTeam(teamId);
    
    // Find the selected team's roster
    const teamRoster = rosters?.find((r: SleeperRoster) => r.roster_id === teamId);
    setSelectedTeamRoster(teamRoster || null);
  };

  const handleAddDraftPick = (pick: {season: string; round: number; pick: number}, side: 'my' | 'their') => {
    if (side === 'my') {
      setMyDraftPicks([...myDraftPicks, pick]);
    } else {
      setTheirDraftPicks([...theirDraftPicks, pick]);
    }
  };

  const handleRemoveDraftPick = (pick: {season: string; round: number; pick: number}, side: 'my' | 'their') => {
    if (side === 'my') {
      setMyDraftPicks(myDraftPicks.filter((p: {season: string; round: number; pick: number}) => 
        p.season !== pick.season || p.round !== pick.round || p.pick !== pick.pick
      ));
    } else {
      setTheirDraftPicks(theirDraftPicks.filter((p: {season: string; round: number; pick: number}) => 
        p.season !== pick.season || p.round !== pick.round || p.pick !== pick.pick
      ));
    }
  };

  const mySideStats: TradeSide = {
    players: mySide,
    draftPicks: myDraftPicks,
    totalProjectedPoints: mySide.reduce((sum: number, p: TradePlayer) => sum + p.projected_pts, 0),
    totalPoints: mySide.reduce((sum: number, p: TradePlayer) => sum + p.pts_ppr, 0)
  };

  const theirSideStats: TradeSide = {
    players: theirSide,
    draftPicks: theirDraftPicks,
    totalProjectedPoints: theirSide.reduce((sum: number, p: TradePlayer) => sum + p.projected_pts, 0),
    totalPoints: theirSide.reduce((sum: number, p: TradePlayer) => sum + p.pts_ppr, 0)
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
                  users?.find(u => u.user_id === currentRoster.owner_id)?.metadata?.team_name || 
                  users?.find(u => u.user_id === currentRoster.owner_id)?.display_name || 
                  `Team ${currentRoster.roster_id}`}
              </span>
            )}
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Players</h3>
              <div className="space-y-2">
                {mySide.map((player: TradePlayer) => (
                  <div key={player.player_id} className="flex justify-between items-center">
                    <span>{player.full_name} ({player.position})</span>
                    <button
                      onClick={() => handleRemovePlayer(player, 'my')}
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
                {myDraftPicks.map((pick, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{pick.season} Round {pick.round} Pick {pick.pick}</span>
                    <button
                      onClick={() => handleRemoveDraftPick(pick, 'my')}
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
            onChange={handleTeamChange}
          >
            <option value="">Select a team</option>
            {rosters
              .filter((r: SleeperRoster) => r.owner_id !== user?.user_id)
              .map((team: SleeperRoster) => {
                const teamUser = users?.find(u => u.user_id === team.owner_id);
                return (
                  <option key={team.roster_id} value={team.roster_id}>
                    {teamUser?.metadata?.team_name || teamUser?.display_name || teamUser?.username || `Team ${team.roster_id}`}
                  </option>
                );
              })}
          </select>

          {selectedTeamRoster && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Players</h3>
                <div className="space-y-2">
                  {theirSide.map((player: TradePlayer) => (
                    <div key={player.player_id} className="flex justify-between items-center">
                      <span>{player.full_name} ({player.position})</span>
                      <button
                        onClick={() => handleRemovePlayer(player, 'their')}
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
                  {theirDraftPicks.map((pick, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{pick.season} Round {pick.round} Pick {pick.pick}</span>
                      <button
                        onClick={() => handleRemoveDraftPick(pick, 'their')}
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
          {currentRoster?.draft_picks && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">My Draft Picks</h3>
              <div className="space-y-2">
                {currentRoster.draft_picks
                  .filter(pick => {
                    // Check if this pick is already in either side of the trade
                    const isInMySide = myDraftPicks.some(p => 
                      p.season === pick.season && p.round === pick.round && p.pick === pick.pick
                    );
                    const isInTheirSide = theirDraftPicks.some(p => 
                      p.season === pick.season && p.round === pick.round && p.pick === pick.pick
                    );
                    return !isInMySide && !isInTheirSide;
                  })
                  .map((pick, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{pick.season} Round {pick.round} Pick {pick.pick}</span>
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
                      .filter(pick => {
                        // Check if this pick is already in either side of the trade
                        const isInMySide = myDraftPicks.some(p => 
                          p.season === pick.season && p.round === pick.round && p.pick === pick.pick
                        );
                        const isInTheirSide = theirDraftPicks.some(p => 
                          p.season === pick.season && p.round === pick.round && p.pick === pick.pick
                        );
                        return !isInMySide && !isInTheirSide;
                      })
                      .map((pick, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{pick.season} Round {pick.round} Pick {pick.pick}</span>
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
} 