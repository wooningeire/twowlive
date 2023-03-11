from math import floor
from random import random
from typing import *

def randint_unrepeating(n: int, max_value: int, generate_number: Callable[[], float]=random) -> List[int]:
    # Prevent `n` from surpassing `max_value`
    n = min(n, max_value)

    output = []

    # Create an available value pool with values [0, 1, 2, …, `max_value`]
    pool = [i for i in range(0, max_value)]
    
    for i in range(0, n):
        # Take a random index, then find the corresponding value from the pool and move it to the output array
        index = floor(generate_number() * len(pool))
        output.append(pool[index])
        del pool[index]

    return output

# arbitrary max and prime factor
seeder_max = 2 ** 31 - 1
prime = 62081

def random_generator_from_int(seed: int=0) -> Callable[]:
    # Move the integer seed into the range [0, `seeder_max`)
    seed = (floor(seed) % seeder_max + seeder_max) % seeder_max

    return lambda: 
        seed = seed * prime % seeder_max
        return seed / seeder_max

def random_generator_from_keyword(keyword: str="") -> Callable[]:
    seed = 1

    for char in keyword.lower():
        # Modulo as extra precaution not to surpass the max safe value
        seed = (seed * ord(char)) % seeder_max

    return random_generator_from_int(seed)