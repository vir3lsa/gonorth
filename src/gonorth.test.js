import gonorth from "./gonorth";

describe('goNORTH', () => {

    it ('Creates a game with the given title', () => {
        const game = gonorth.createGame('The Witch\'s Grotto');
        expect(game.title).toBe('The Witch\'s Grotto');
    });

});