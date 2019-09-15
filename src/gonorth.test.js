import gonorth from "./gonorth";
import * as outputDependency from './output';

const title = 'Space Auctioneer 2';

let outputSpy;
let game;

describe('goNORTH', () => {

    beforeEach(() => {
        outputSpy = jest.spyOn(outputDependency, 'output');
        game = gonorth.createGame(title);
    });

    afterEach(() => {
        outputSpy.mockRestore();
    });

    it ('Creates a game with the given title', () => {
        const game = gonorth.createGame('The Witch\'s Grotto');
        expect(game.title).toBe('The Witch\'s Grotto');
    });

    it ('Prints the game title', () => {
        let outputCalled = false;
        outputSpy.mockImplementation(text => {
            outputCalled = true;
            expect(text).toBe('S p a c e   A u c t i o n e e r   2');
        });

        gonorth.playGame(game);

        expect(outputCalled).toBe(true);
    });

});