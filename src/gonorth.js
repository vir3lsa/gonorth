import Game from './game';
import { output } from './output';

const createGame = title => {
    return new Game(title);
};

const playGame = game => {
    if (!game) {
        console.error('No game to play');
    }

    output(formatTitle(game.title || 'Untitled'));
};

const formatTitle = title => [...title].map((c, i) => {
    return `${c}${i === title.length - 1 ? '' : ' '}`;
}).join('');

export default {
    createGame,
    playGame
}