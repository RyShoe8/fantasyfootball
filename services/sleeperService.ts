import axios from 'axios';
import { SleeperUser, SleeperLeague, SleeperRoster, SleeperPlayer, SleeperDraftPick } from '../types/sleeper';

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export class SleeperService {
  private username: string;
  private userId: string | null = null;

  constructor(username: string) {
    this.username = username;
  }

  async initialize() {
    if (!this.userId) {
      const user = await this.getUser();
      this.userId = user.user_id;
    }
  }

  async getUser(): Promise<SleeperUser> {
    const response = await axios.get(`${SLEEPER_API_BASE}/user/${this.username}`);
    return response.data;
  }

  async getLeagues(season: string = new Date().getFullYear().toString()): Promise<SleeperLeague[]> {
    await this.initialize();
    const response = await axios.get(`${SLEEPER_API_BASE}/user/${this.userId}/leagues/nfl/${season}`);
    return response.data;
  }

  async getLeague(leagueId: string): Promise<SleeperLeague> {
    const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}`);
    return response.data;
  }

  async getRosters(leagueId: string): Promise<SleeperRoster[]> {
    const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/rosters`);
    return response.data;
  }

  async getRoster(leagueId: string, rosterId: string): Promise<SleeperRoster> {
    const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/roster/${rosterId}`);
    return response.data;
  }

  async getPlayers(): Promise<{ [key: string]: SleeperPlayer }> {
    const response = await axios.get(`${SLEEPER_API_BASE}/players/nfl`);
    return response.data;
  }

  async getPlayer(playerId: string): Promise<SleeperPlayer> {
    const response = await axios.get(`${SLEEPER_API_BASE}/players/nfl/${playerId}`);
    return response.data;
  }

  async getMatchups(leagueId: string, week: number): Promise<any[]> {
    const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/matchups/${week}`);
    return response.data;
  }

  async getPlayoffBracket(leagueId: string): Promise<any> {
    const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/winners_bracket`);
    return response.data;
  }

  async getDraftPicks(leagueId: string): Promise<SleeperDraftPick[]> {
    const response = await axios.get(`${SLEEPER_API_BASE}/league/${leagueId}/draft_picks`);
    return response.data;
  }
} 