import { Crown, Users, UserPlus } from 'lucide-react';
import { TEAMS, ROLES } from '../utils/gameLogic';

const PlayerAssignment = ({ gameState, currentPlayer, onAssignPlayer, isAssigning }) => {
  const getTeamStatus = (team) => {
    const teamData = gameState.teams[team];
    return {
      hasSpymaster: !!teamData.spymaster,
      operativeCount: teamData.operatives.length,
      needsSpymaster: !teamData.spymaster,
      canAddOperative: teamData.operatives.length < 3 // Max 3 operatives per team
    };
  };

  const redStatus = getTeamStatus(TEAMS.RED);
  const blueStatus = getTeamStatus(TEAMS.BLUE);

  const renderTeamCard = (team, status) => {
    const teamColor = team === TEAMS.RED ? 'red' : 'blue';
    
    return (
      <div className={`assignment-card ${teamColor}`}>
        <div className="card-header">
          <div className={`team-indicator ${teamColor}`}></div>
          <h3>{team.toUpperCase()} TEAM</h3>
        </div>

        <div className="team-composition">
          <div className="role-status">
            <div className="role-info">
              <Crown size={20} />
              <span>Spymaster</span>
            </div>
            <div className="status-indicator">
              {status.hasSpymaster ? (
                <span className="filled">✓ Assigned</span>
              ) : (
                <span className="empty">Need 1</span>
              )}
            </div>
          </div>

          <div className="role-status">
            <div className="role-info">
              <Users size={20} />
              <span>Operatives</span>
            </div>
            <div className="status-indicator">
              <span className={status.operativeCount > 0 ? 'filled' : 'empty'}>
                {status.operativeCount}/3
              </span>
            </div>
          </div>
        </div>

        <div className="assignment-actions">
          {status.needsSpymaster && (
            <button
              onClick={() => onAssignPlayer(team, ROLES.SPYMASTER)}
              disabled={isAssigning}
              className="assign-button spymaster"
            >
              <Crown size={16} />
              Join as Spymaster
            </button>
          )}

          {status.canAddOperative && (
            <button
              onClick={() => onAssignPlayer(team, ROLES.OPERATIVE)}
              disabled={isAssigning}
              className="assign-button operative"
            >
              <Users size={16} />
              Join as Operative
            </button>
          )}

          {!status.needsSpymaster && !status.canAddOperative && (
            <div className="team-full">
              <span>Team Full</span>
            </div>
          )}
        </div>

        <div className="role-descriptions">
          <div className="role-desc">
            <Crown size={14} />
            <div>
              <strong>Spymaster:</strong> Give clues to help your team find words. You can see all card types.
            </div>
          </div>
          <div className="role-desc">
            <Users size={14} />
            <div>
              <strong>Operative:</strong> Guess words based on clues from your spymaster. Avoid the assassin!
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="player-assignment">
      <div className="assignment-header">
        <UserPlus size={32} />
        <h2>Choose Your Team & Role</h2>
        <p>
          Select which team you want to join and what role you want to play. 
          Each team needs exactly one spymaster and at least one operative to start the game.
        </p>
      </div>

      <div className="assignment-grid">
        {renderTeamCard(TEAMS.RED, redStatus)}
        {renderTeamCard(TEAMS.BLUE, blueStatus)}
      </div>

      <div className="assignment-info">
        <h3>Game Setup Requirements</h3>
        <div className="requirements-list">
          <div className="requirement">
            <div className="req-icon">
              {redStatus.hasSpymaster ? '✅' : '❌'}
            </div>
            <span>Red team spymaster</span>
          </div>
          <div className="requirement">
            <div className="req-icon">
              {redStatus.operativeCount > 0 ? '✅' : '❌'}
            </div>
            <span>Red team operative(s)</span>
          </div>
          <div className="requirement">
            <div className="req-icon">
              {blueStatus.hasSpymaster ? '✅' : '❌'}
            </div>
            <span>Blue team spymaster</span>
          </div>
          <div className="requirement">
            <div className="req-icon">
              {blueStatus.operativeCount > 0 ? '✅' : '❌'}
            </div>
            <span>Blue team operative(s)</span>
          </div>
        </div>

        <div className="setup-tips">
          <h4>Tips for New Players:</h4>
          <ul>
            <li><strong>Spymaster:</strong> Strategic role - you give clues but can't guess</li>
            <li><strong>Operative:</strong> Active role - you make guesses based on clues</li>
            <li><strong>Team Balance:</strong> 2-4 players per team works best</li>
            <li><strong>Communication:</strong> Spymasters can only communicate through clues</li>
          </ul>
        </div>
      </div>

      {isAssigning && (
        <div className="assignment-loading">
          <div className="loading-spinner"></div>
          <span>Joining team...</span>
        </div>
      )}
    </div>
  );
};

export default PlayerAssignment;
