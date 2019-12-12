// run tests
var path = require('path')

var Chess = require(path.join(process.cwd(), '/app/chess.js')).Chess
var chess = new Chess()

var errCount = {}

function testDrawParagraph() {

    console.log("Dies ist ein TEST")
    
}

function testBoardFromFEN(fen) {

    // convert position to valid FEN
    var dummyInfo = ' w - - 0 1'
    
    chess.load(fen + dummyInfo)
    console.log(chess.ascii())
}

function testGameFromFEN() {

        var gameObj = {
        0: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",
        1: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR",
        2: "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R",
        3: "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R",
        4: "rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R",
        5: "rnbqkbnr/pp2pppp/3p4/8/3pP3/5N2/PPP2PPP/RNBQKB1R",
        6: "rnbqkbnr/pp2pppp/3p4/8/3NP3/8/PPP2PPP/RNBQKB1R",
        7: "rnbqkb1r/pp2pppp/3p1n2/8/3NP3/8/PPP2PPP/RNBQKB1R",
        8: "rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R",
        9: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R",
        10: "rnbqkb1r/1p2pppp/p2p1n2/8/P2NP3/2N5/1PP2PPP/R1BQKB1R",
        11: "rnbqkb1r/1p3ppp/p2p1n2/4p3/P2NP3/2N5/1PP2PPP/R1BQKB1R",
        12: "rnbqkb1r/1p3ppp/p2p1n2/4p3/P3P3/2N2N2/1PP2PPP/R1BQKB1R",
        13: "rnbqk2r/1p2bppp/p2p1n2/4p3/P3P3/2N2N2/1PP2PPP/R1BQKB1R",
        14: "rnbqk2r/1p2bppp/p2p1n2/4p3/P3P3/2N2N1P/1PP2PP1/R1BQKB1R",
        15: "rnbq1rk1/1p2bppp/p2p1n2/4p3/P3P3/2N2N1P/1PP2PP1/R1BQKB1R",
        16: "rnbq1rk1/1p2bppp/p2p1n2/4p3/P3P3/2NB1N1P/1PP2PP1/R1BQK2R",
        17: "rn1q1rk1/1p2bppp/p2pbn2/4p3/P3P3/2NB1N1P/1PP2PP1/R1BQK2R",
        18: "rn1q1rk1/1p2bppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP2PP1/R2QK2R",
        19: "r2q1rk1/1p1nbppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP2PP1/R2QK2R",
        20: "r2q1rk1/1p1nbppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP2PP1/R2Q1RK1",
        21: "2rq1rk1/1p1nbppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP2PP1/R2Q1RK1",
        22: "2rq1rk1/1p1nbppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP1QPP1/R4RK1",
        23: "2r2rk1/1pqnbppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP1QPP1/R4RK1",
        24: "2r2rk1/1pqnbppp/p2pbn2/4p1B1/P3P3/2NB1N1P/1PP1QPP1/R2R2K1",
        25: "2r2rk1/1pqnbpp1/p2pbn1p/4p1B1/P3P3/2NB1N1P/1PP1QPP1/R2R2K1",
        26: "2r2rk1/1pqnbpp1/p2pbn1p/4p3/P3P3/2NB1N1P/1PPBQPP1/R2R2K1",
        27: "2rr2k1/1pqnbpp1/p2pbn1p/4p3/P3P3/2NB1N1P/1PPBQPP1/R2R2K1",
        28: "2rr2k1/1pqnbpp1/p2pbn1p/4p3/PP2P3/2NB1N1P/2PBQPP1/R2R2K1",
        29: "2rr2k1/1pq1bpp1/pn1pbn1p/4p3/PP2P3/2NB1N1P/2PBQPP1/R2R2K1",
        30: "2rr2k1/1pq1bpp1/pn1pbn1p/1P2p3/P3P3/2NB1N1P/2PBQPP1/R2R2K1",
        31: "2rr2k1/1pq1bpp1/p2pbn1p/1P2p3/P1n1P3/2NB1N1P/2PBQPP1/R2R2K1",
        32: "2rr2k1/1pq1bpp1/p2pbn1p/1P2p3/P1n1P3/2NB1N1P/2P1QPP1/R1BR2K1",
        33: "2rr2k1/1p2bpp1/p2pbn1p/qP2p3/P1n1P3/2NB1N1P/2P1QPP1/R1BR2K1",
        34: "2rr2k1/1p2bpp1/p2pbn1p/qP2p3/P1n1P3/2NB1N1P/2P2PP1/R1BRQ1K1",
        35: "3r2k1/1p2bpp1/p2pbn1p/qPr1p3/P1n1P3/2NB1N1P/2P2PP1/R1BRQ1K1",
        36: "3r2k1/1p2bpp1/p2pbn1p/qPr1p3/P1n1P3/3B1N1P/2P2PP1/RNBRQ1K1",
        37: "3r2k1/1p2bpp1/p2pbn1p/1Pr1p3/P1n1P3/3B1N1P/2P2PP1/RNBRq1K1",
        38: "3r2k1/1p2bpp1/p2pbn1p/1Pr1p3/P1n1P3/3B1N1P/2P2PP1/RNB1R1K1",
        39: "3r2k1/1p2bpp1/3pbn1p/1pr1p3/P1n1P3/3B1N1P/2P2PP1/RNB1R1K1",
        40: "3r2k1/1p2bpp1/3pbn1p/1Pr1p3/2n1P3/3B1N1P/2P2PP1/RNB1R1K1",
        41: "3r2k1/1p2bpp1/3pbn1p/1r2p3/2n1P3/3B1N1P/2P2PP1/RNB1R1K1",
        42: "3r2k1/1p2bpp1/3pbn1p/1r2p3/2n1P3/3B1N1P/2PN1PP1/R1B1R1K1",
        43: "3r2k1/1p2bpp1/3pbn1p/2r1p3/2n1P3/3B1N1P/2PN1PP1/R1B1R1K1",
        44: "3r2k1/1p2bpp1/3pbn1p/2r1p3/2N1P3/3B1N1P/2P2PP1/R1B1R1K1",
        45: "3r2k1/1p2bpp1/3p1n1p/2r1p3/2b1P3/3B1N1P/2P2PP1/R1B1R1K1",
        46: "3r2k1/1p2bpp1/3p1n1p/2r1p3/2b1P3/B2B1N1P/2P2PP1/R3R1K1",
        47: "3r2k1/1pr1bpp1/3p1n1p/4p3/2b1P3/B2B1N1P/2P2PP1/R3R1K1",
        48: "3r2k1/1pr1bpp1/3p1n1p/4N3/2b1P3/B2B3P/2P2PP1/R3R1K1",
        49: "3r2k1/1pr1bpp1/5n1p/4p3/2b1P3/B2B3P/2P2PP1/R3R1K1",
        50: "3r2k1/1pr1Bpp1/5n1p/4p3/2b1P3/3B3P/2P2PP1/R3R1K1",
        51: "6k1/1prrBpp1/5n1p/4p3/2b1P3/3B3P/2P2PP1/R3R1K1",
        52: "3r2k1/1pr1bpp1/3p1n1p/4N3/4P3/B2b3P/2P2PP1/R3R1K1",
        53: "3r2k1/1pr1bpp1/3p1n1p/8/4P3/B2N3P/2P2PP1/R3R1K1",
        54: "3r2k1/1p2bpp1/3p1n1p/8/4P3/B2N3P/2r2PP1/R3R1K1",
        55: "3r2k1/1p2bpp1/3pbn1p/r3p3/2n1P3/3B1N1P/2PN1PP1/R1B1R1K1",
        56: "3r2k1/1p2bpp1/3pbn1p/r3p3/2n1P3/3B1N1P/1BPN1PP1/R3R1K1",
        57: "3r2k1/1p2bpp1/3pbn1p/4p3/2n1P3/3B1N1P/1BPN1PP1/r3R1K1",
        58: "3r2k1/1p2bpp1/3pbn1p/4p3/2n1P3/3B1N1P/2PN1PP1/B3R1K1",
        59: "3r2k1/4bpp1/3pbn1p/1p2p3/2n1P3/3B1N1P/2PN1PP1/B3R1K1"
    }

    for (key in Object.keys(gameObj)) {
        testBoardFromFEN(gameObj[key])
    }
    
}


function runTests() {
    
    //testDrawParagraph()
    testGameFromFEN()


    
    console.log("TEST COMPLETED")
    console.log("Errors:")
    console.log(errCount)
    
}

runTests()

