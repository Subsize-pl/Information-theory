// P(x) = x^26 + x^8 + x^7 + x + 1
// m = 26

const REGISTER_SIZE = 26;

/*
 *  Agreement:
 *  state[0] = highest (position m = 26)
 *  state[25] = lowest (position 1)
 *
 *  k position -> (REGISTER_SIZE − k):
 *   x^26 -> 0   x^8 -> 18   x^7 -> 19   x^1 -> 25
 */

const TAP_INDICES = [0, 18, 19, 25];

class LFSR {
  constructor(seedStr) {
    this.state = seedStr.split("").map(Number);
  }

  nextBit() {
    const outputBit = this.state[0];

    const feedback = TAP_INDICES.reduce(
      (xorAcc, idx) => xorAcc ^ this.state[idx],
      0,
    );

    for (let i = 0; i < REGISTER_SIZE - 1; i++) {
      this.state[i] = this.state[i + 1];
    }
    this.state[REGISTER_SIZE - 1] = feedback;

    return outputBit;
  }

  nextByte() {
    let byte = 0;
    for (let i = 0; i < 8; i++) {
      byte = (byte << 1) | this.nextBit();
    }
    return byte;
  }
}
