import { Crown, Users, Target, Trophy } from 'lucide-react';
import { TEAMS, ROLES } from '../utils/gameLogic';

const TeamPanel = ({ gameState, currentPlayer, gameStatus }) => {
  const getPlayerName = (playerId) => {
    return gameState.players[playerId]?.name || 'Unknown Player';
  };

  const renderTeam = (teamColor) => {
    const team = gameState.teams[teamColor];
    const teamData = gameStatus?.teams[teamColor];
    const isCurrentPlayerTeam = currentPlayer?.team === teamColor;
    
    return (
      <div className={`team-section ${teamColor} ${isCurrentPlayerTeam ? 'current-team' : ''}`}>
        <div className="team-header">
          <div className="team-title">
            <div className={`team-color-indicator ${teamColor}`}></div>
            <h3>{teamColor.toUpperCase()} TEAM</h3>
            {gameState.currentTeam === teamColor && gameState.phase === 'in_progress' && (
              <Target size={16} className="active-turn-icon" />
            )}
          </div>
          
          {teamData && (
            <div className="team-progress">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${teamColor}`}
                  style={{ width: `${teamData.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {teamData.cardsRevealed} / {teamData.cardsTotal}
              </span>
            </div>
          )}
        </div>

        <div className="team-members">
          {/* Spymaster */}
          <div className="role-section">
            <div className="role-header">
              <Crown size={16} />
              <span>Spymaster</span>
            </div>
            {team.spymaster ? (
              <div className={`player-item spymaster ${currentPlayer?.id === team.spymaster ? 'current-player' : ''}`}>
                <span className="player-name">
                  {getPlayerName(team.spymaster)}
                  {currentPlayer?.id === team.spymaster && ' (You)'}
                </span>
                <div className={`online-indicator ${gameState.players[team.spymaster]?.isOnline ? 'online' : 'offline'}`}></div>
              </div>
            ) : (
              <div className="empty-slot">
                <span>No spymaster assigned</span>
              </div>
            )}
          </div>

          {/* Operatives */}
          <div className="role-section">
            <div className="role-header">
              <Users size={16} />
              <span>Operatives</span>
            </div>
            {team.operatives.length > 0 ? (
              <div className="operatives-list">
                {team.operatives.map(operativeId => (
                  <div 
                    key={operativeId}
                    className={`player-item operative ${currentPlayer?.id === operativeId ? 'current-player' : ''}`}
                  >
                    <span className="player-name">
                      {getPlayerName(operativeId)}
                      {currentPlayer?.id === operativeId && ' (You)'}
                    </span>
                    <div className={`online-indicator ${gameState.players[operativeId]?.isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-slot">
                <span>No operatives assigned</span>
              </div>
            )}
          </div>
        </div>

        {gameState.winner === teamColor && (
          <div className="winner-badge">
            <Trophy size={20} />
            <span>WINNERS!</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="team-panel">
      <h2 className="panel-title">Teams</h2>
      
      <div className="teams-container">
        {renderTeam(TEAMS.RED)}
        {renderTeam(TEAMS.BLUE)}
      </div>

      {currentPlayer && (
        <div className="current-player-info">
          <h3>Your Role</h3>
          <div className="player-status">
            {currentPlayer.team ? (
              <>
                <div className={`team-badge ${currentPlayer.team}`}>
                  {currentPlayer.team.toUpperCase()} TEAM
                </div>
                <div className={`role-badge ${currentPlayer.role}`}>
                  {currentPlayer.role === ROLES.SPYMASTER ? (
                    <>
                      <Crown size={16} />
                      Spymaster
                    </>
                  ) : (
                    <>
                      <Users size={16} />
                      Operative
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="no-assignment">
                <span>Not assigned to a team</span>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState.phase === 'in_progress' && gameStatus && (
        <div className="game-status-info">
          <h3>Game Status</h3>
          <div className="status-items">
            {gameStatus.isYourTurn && (
              <div className="status-item active">
                <Target size={16} />
                <span>Your team's turn</span>
              </div>
            )}
            
            {gameStatus.canGiveClues && (
              <div className="status-item">
                <Crown size={16} />
                <span>You can give clues</span>
              </div>
            )}
            
            {gameStatus.canRevealCards && (
              <div className="status-item">
                <Users size={16} />
                <span>You can reveal cards</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPanel;
