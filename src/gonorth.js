import Game from './game';

export default {

    createGame: title => {
        return new Game(title);
    }

}