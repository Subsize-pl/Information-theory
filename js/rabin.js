// (2m + b)² = b² + 4c (mod n)  <- the equation reduces to finding the square root
// D = b² + 4c modulo n using the Chinese Remainder Theorem (CRT).
// From the 4 roots, we select the one that yields m ∈ [0, 255].

/**
 * Fast exponentiation modulo.
 * Calculates: base^exp mod <mod>
 * Uses the sequential squaring method.
 */
function fastExp(base, exp, mod) {
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * The extended Euclidean algorithm.
 * Returns [gcd, x, y] so that a*x + b*y = gcd(a, b).
 */
function extGCD(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extGCD(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

/**
 * Simplicity check using trial divisors.
 * Fast enough for p,q up to ~10^7.
 */
function isPrime(n) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;
  for (let i = 5n; i * i <= n; i += 6n) {
    if (n % i === 0n || n % (i + 2n) === 0n) return false;
  }
  return true;
}

/**
 * Encrypts one byte m ∈ [0, 255].
 * c= m*(m+b) mod n
 *
 * Returns a BigInt encrypted value (can be > 255).
 */
function rabinEncryptByte(m, b, n) {
  const mB = BigInt(m);
  return (mB * (mB + b)) % n;
}

/**
 * Decrypts a single encrypted c value.
 * Returns bytes (0-255) or null if decryption failed.
 *
 * Algorithm:
 * 1. D = b2 + 4c mod n ← discriminant
 *   2. mp = D^((p+1)/4) mod p ← sqrt(D) mod p (works because p ≡ 3 mod 4)
 * 3. mq = D^((q+1)/4) mod q   ← sqrt(D) mod q
 * 4. By WHO we build 4 roots sqrt(D) mod n
 * 5. From each root di: m = (di − b) * inv(2) mod n
 * = halfMod((di−b) mod n, n), because n is odd
 * 6. We take m < 256 — this is the source byte.
 */
function rabinDecryptValue(c, p, q, b, n) {
  const D = (b * b + 4n * c) % n;

  const mp = fastExp(D, (p + 1n) / 4n, p);
  const mq = fastExp(D, (q + 1n) / 4n, q);

  const [, yp, yq] = extGCD(p, q);

  const crt = (aSqrt, bSqrt) => {
    const raw = aSqrt * yq * q + bSqrt * yp * p;
    return ((raw % n) + n) % n;
  };

  const r1 = crt(mp, mq);
  const r2 = (n - r1) % n; // CRT(-mp, -mq) = n - r1
  const r3 = crt(p - mp, mq); // CRT(-mp mod p, mq)
  const r4 = (n - r3) % n; // CRT(mp, -mq mod q) = n - r3

  /**
   * Restoring m from the root of di:
   *   2m ≡ di − b (mod n)  =>  m = (di−b) * inv(2) mod n
   *
   * Division by 2 modulo odd n:
   * if (di−b) mod n is even → m = number / 2
   * if odd -> m = (number + n) / 2 (n is odd → sum is even)
   */
  for (const di of [r1, r2, r3, r4]) {
    const diff = (((di - b) % n) + n) % n;
    const m = diff % 2n === 0n ? diff / 2n : (diff + n) / 2n;
    if (m < 256n) return Number(m);
  }

  return null; // none of the 4 roots yielded bytes in [0,255]
}
