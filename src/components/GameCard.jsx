import { Skull } from 'lucide-react';
import { CARD_TYPES } from '../utils/gameLogic';

const GameCard = ({ card, showType, canReveal, onReveal }) => {
  const getCardClass = () => {
    let classes = 'game-card';
    
    if (card.revealed) {
      classes += ' revealed';
      classes += ` ${card.type}`;
    } else if (showType) {
      classes += ` preview ${card.type}`;
    }
    
    if (canReveal) {
      classes += ' clickable';
    }
    
    return classes;
  };

  const getCardIcon = () => {
    if (card.type === CARD_TYPES.ASSASSIN && (card.revealed || showType)) {
      return <Skull size={20} className="assassin-icon" />;
    }
    return null;
  };

  const getCardLabel = () => {
    if (!showType && !card.revealed) return null;
    
    switch (card.type) {
      case CARD_TYPES.RED_TEAM:
        return <span className="card-label red">RED</span>;
      case CARD_TYPES.BLUE_TEAM:
        return <span className="card-label blue">BLUE</span>;
      case CARD_TYPES.NEUTRAL:
        return <span className="card-label neutral">NEUTRAL</span>;
      case CARD_TYPES.ASSASSIN:
        return <span className="card-label assassin">ASSASSIN</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className={getCardClass()}
      onClick={canReveal ? onReveal : undefined}
      role={canReveal ? "button" : undefined}
      tabIndex={canReveal ? 0 : -1}
      onKeyDown={canReveal ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onReveal();
        }
      } : undefined}
    >
      <div className="card-content">
        <div className="card-word">
          {card.word}
        </div>
        
        {getCardIcon()}
        
        {getCardLabel()}
        
        {card.revealed && card.revealedBy && (
          <div className="card-revealed-info">
            <small>Revealed by player</small>
          </div>
        )}
      </div>
      
      {canReveal && (
        <div className="card-hover-hint">
          Click to reveal
        </div>
      )}
    </div>
  );
};

export default GameCard;
