// ===== CONTENT =====
// Exercise helpers. Every exercise type is data, so new lessons are just new entries.
const learn = (title, text, code, out) => ({ t: 'learn', title, text, code, out });
const mc = (q, opts, a, hint, code) => ({ t: 'mc', q, opts, a, hint, code });
const predict = (code, opts, a, hint) => ({ t: 'predict', q: 'What will this print?', code, opts, a, hint });
const blocks = (q, tokens, extra, hint) => ({ t: 'blocks', q, tokens, extra, hint });
const fill = (q, code, opts, a, hint) => ({ t: 'fill', q, code, opts, a, hint });
const bug = (q, lines, a, why) => ({ t: 'bug', q, lines, a, why });
const code = (q, expect, solution, o = {}) => ({ t: 'code', q, expect, solution, start: o.start || '', must: o.must || [], mustAny: o.mustAny || [], hint: o.hint || '' });

const UNITS = [
  {
    id: 'u1', title: 'Say hello', emoji: '👋', color: '#2f6fe4', desc: 'Make the computer talk with print()',
    lessons: [
      { id: 'u1l1', title: 'Meet print()', ex: [
        learn('Hi, I\'m Pip!', 'Computers follow instructions. In Python, print() tells the computer to show words on the screen. Put your words inside quotes.', `print("Hello!")`, 'Hello!'),
        mc('Which one shows Hello on the screen?', ['print("Hello")', 'show Hello', 'Hello.print', 'say("Hello")'], 0, 'Look for print with round brackets and quotes.'),
        blocks('Build code that shows Hi', ['print', '(', '"Hi"', ')'], ['"Bye"'], 'Start with print, then open the bracket.'),
        predict(`print("I love pizza")`, ['I love pizza', '"I love pizza"', 'print', 'Nothing'], 0, 'The quotes don\'t show up. Only the words inside them do.'),
        fill('Fill the blank so it shows Pip', `print(___)`, ['"Pip"', 'Pip"', '(Pip)'], 0, 'Words need a quote on both sides.'),
        code('Write code that shows: Hello, world!', 'Hello, world!', `print("Hello, world!")`, { start: 'print()', must: ['print'], hint: 'Type your words inside print( ) with quotes around them.' }),
      ] },
      { id: 'u1l2', title: 'Lines and numbers', ex: [
        learn('One print, one line', 'Each print() shows its words on a new line. The computer runs your code from top to bottom.', `print("Roses are red")\nprint("Pip is blue")`, 'Roses are red\nPip is blue'),
        predict(`print("A")\nprint("B")`, ['A\nB', 'AB', 'B\nA', 'A B'], 0, 'Two prints make two lines, top to bottom.'),
        bug('Tap the line with a mistake', ['print("Cats")', 'print("Dogs)', 'print("Fish")'], 1, 'The quote after Dogs is missing. Quotes come in pairs!'),
        mc('Numbers don\'t need quotes. What does this show?', ['7', '"7"', 'seven', 'An error'], 0, 'print shows the number itself.', `print(7)`),
        blocks('Build code that shows the number 10', ['print', '(', '10', ')'], ['ten', '"'], 'Numbers go inside print( ) without quotes.'),
        code('Write two lines: first Ready, then Go!', 'Ready\nGo!', `print("Ready")\nprint("Go!")`, { must: ['print'], hint: 'Use two print( ) lines, one under the other.' }),
      ] },
    ],
  },
  {
    id: 'u2', title: 'Number magic', emoji: '🔢', color: '#e8a400', desc: 'Python is a super calculator',
    lessons: [
      { id: 'u2l1', title: 'The math machine', ex: [
        learn('Adding and taking away', 'Python can do math for you. Use + to add and - to take away.', `print(2 + 3)\nprint(10 - 4)`, '5\n6'),
        predict(`print(4 + 4)`, ['8', '44', '4 + 4', 'An error'], 0, 'Without quotes, Python does the math.'),
        mc('Which sign means multiply in Python?', ['*', 'x', '×', '#'], 0, 'It\'s a little star.'),
        predict(`print(3 * 5)`, ['15', '35', '8', '3 * 5'], 0, '3 groups of 5.'),
        predict(`print(10 / 2)`, ['5.0', '5', '20', '2'], 0, 'Dividing with / always gives a number with a dot, like 5.0'),
        blocks('Build code that shows 6 times 7', ['print', '(', '6', '*', '7', ')'], ['x', '+'], 'Multiply uses the star *'),
        code('Use print to show the answer to 12 + 30', '42', `print(12 + 30)`, { must: ['+'], hint: 'Let Python add it: print(12 + 30)' }),
      ] },
      { id: 'u2l2', title: 'Number tricks', ex: [
        learn('Leftovers and powers', '// divides and drops the leftovers. % gives you only the leftovers. ** means power: 2 ** 3 is 2 × 2 × 2.', `print(7 // 2)\nprint(7 % 2)\nprint(2 ** 3)`, '3\n1\n8'),
        predict(`print(9 % 4)`, ['1', '2', '2.25', '0'], 0, '4 goes into 9 two times, with 1 left over.'),
        predict(`print(2 + 3 * 4)`, ['14', '20', '24', '9'], 0, 'Python does * before +, just like in math class.'),
        mc('What does ** do?', ['Power, like 2 to the 3rd', 'Multiplies twice as fast', 'Makes a comment', 'Nothing'], 0, '2 ** 3 means 2 × 2 × 2'),
        fill('Make it print 25 (5 squared)', `print(5 ___ 2)`, ['**', '*', '//'], 0, '5 × 5 is 25. Which sign makes a power?'),
        code('Print what\'s left over when 17 is divided by 5', '2', `print(17 % 5)`, { must: ['%'], hint: 'The % sign gives the leftover.' }),
      ] },
    ],
  },
  {
    id: 'u3', title: 'Memory boxes', emoji: '📦', color: '#16a36a', desc: 'Variables remember things for you',
    lessons: [
      { id: 'u3l1', title: 'Make a variable', ex: [
        learn('A box with a name', 'A variable is a box with a name on it. The = sign puts something into the box. Later, use the name to get it back.', `score = 10\nprint(score)`, '10'),
        predict(`pet = "cat"\nprint(pet)`, ['cat', 'pet', '"cat"', 'An error'], 0, 'print(pet) shows what is inside the pet box.'),
        mc('Which line makes a variable called age with 8 in it?', ['age = 8', '8 = age', 'age == 8', '"age" = 8'], 0, 'Name first, then =, then the value.'),
        blocks('Make a variable named hero that holds "Pip"', ['hero', '=', '"Pip"'], ['==', 'print'], 'The box name goes first.'),
        bug('Tap the line with a mistake', ['color = "red"', 'print(colour)'], 1, 'The box is named color, but print asks for colour. Names must match exactly!'),
        code('Make a variable called fruit that holds "apple", then print it', 'apple', `fruit = "apple"\nprint(fruit)`, { must: ['fruit', '='], hint: 'Line 1: fruit = "apple". Line 2: print(fruit)' }),
      ] },
      { id: 'u3l2', title: 'Changing boxes', ex: [
        learn('New stuff in the box', 'You can change what\'s in a box. coins = coins + 2 means: take what\'s in coins, add 2, and put it back.', `coins = 5\ncoins = coins + 2\nprint(coins)`, '7'),
        predict(`a = 3\na = 8\nprint(a)`, ['8', '3', '11', '3 8'], 0, 'The box only keeps the newest thing.'),
        predict(`x = 4\ny = x * 2\nprint(y)`, ['8', '4', 'x * 2', '42'], 0, 'x is 4, so y is 4 × 2.'),
        mc('Which variable name is NOT allowed?', ['2cool', 'cool2', 'my_score', '_secret'], 0, 'Names can\'t start with a number.'),
        fill('Add 10 to points', `points = 5\npoints = points ___ 10\nprint(points)`, ['+', '=', '-'], 0, 'Which sign adds?'),
        code('lives starts at 3. Take away 1, then print lives', '2', `lives = 3\nlives = lives - 1\nprint(lives)`, { start: 'lives = 3\n', must: ['lives', '-'], hint: 'lives = lives - 1, then print(lives)' }),
      ] },
    ],
  },
  {
    id: 'u4', title: 'Word power', emoji: '🔤', color: '#d94a8c', desc: 'Play with strings of letters',
    lessons: [
      { id: 'u4l1', title: 'Gluing words', ex: [
        learn('Strings', 'Text inside quotes is called a string. A + sign glues two strings together.', `print("ice" + "cream")`, 'icecream'),
        predict(`print("Hi " + "Pip")`, ['Hi Pip', 'HiPip', 'Hi + Pip', 'An error'], 0, 'Look closely: there\'s a space after Hi.'),
        predict(`print("ha" * 3)`, ['hahaha', 'ha3', 'ha ha ha', 'An error'], 0, '* repeats a string.'),
        mc('What does this give?', ['5', '6', 'robot', 'r'], 0, 'len counts the letters.', `len("robot")`),
        blocks('Build code that shows how many letters are in "python"', ['print', '(', 'len', '(', '"python"', ')', ')'], ['count'], 'len( ) goes inside print( ). Two brackets close at the end.'),
        code('Glue "sun" and "flower" together and print it', 'sunflower', `print("sun" + "flower")`, { must: ['+'], hint: 'print("sun" + "flower")' }),
      ] },
      { id: 'u4l2', title: 'String tricks', ex: [
        learn('Big letters and f-strings', '.upper() makes BIG letters. An f-string lets you drop a variable into text using { }.', `name = "Mia"\nprint(name.upper())\nprint(f"Hi {name}!")`, 'MIA\nHi Mia!'),
        predict(`word = "cat"\nprint(word.upper())`, ['CAT', 'cat', 'Cat', 'WORD'], 0, 'upper means uppercase: all big letters.'),
        predict(`word = "pip"\nprint(word[0])`, ['p', 'i', 'pip', '0'], 0, 'Python starts counting at 0!'),
        fill('Make it print: I am 9', `age = 9\nprint(f"I am ___")`, ['{age}', 'age', '(age)'], 0, 'f-strings use curly brackets { }.'),
        bug('Tap the line with a mistake', ['name = "Leo"', 'print("Hi " + name)', 'print("Bye " name)'], 2, 'You need a + to glue "Bye " and name together.'),
        code('Make hero = "Pip", then print Go Pip! using an f-string', 'Go Pip!', `hero = "Pip"\nprint(f"Go {hero}!")`, { must: ['{hero}'], hint: 'print(f"Go {hero}!")' }),
      ] },
    ],
  },
  {
    id: 'u5', title: 'Making choices', emoji: '🔀', color: '#7b4fd6', desc: 'True, False, if and else',
    lessons: [
      { id: 'u5l1', title: 'True or False', ex: [
        learn('Asking questions', 'Python can compare things. The answer is always True or False. Two equals signs == ask: are these the same?', `print(5 > 3)\nprint(2 == 7)`, 'True\nFalse'),
        predict(`print(10 < 4)`, ['False', 'True', '10', 'An error'], 0, 'Is 10 smaller than 4?'),
        mc('Which one asks "is a the same as b?"', ['a == b', 'a = b', 'a =! b', 'a equals b'], 0, 'One = puts things in a box. Two == compare.'),
        learn('if', 'if runs the inside code only when the test is True. Notice the colon : at the end, and the 4 spaces before the inside line.', `age = 9\nif age > 5:\n    print("You can play!")`, 'You can play!'),
        predict(`x = 2\nif x > 5:\n    print("big")\nprint("done")`, ['done', 'big\ndone', 'big', 'Nothing'], 0, '2 is not bigger than 5, so the inside line is skipped.'),
        bug('Tap the line with a mistake', ['score = 100', 'if score > 50', '    print("Great!")'], 1, 'An if line must end with a colon :'),
      ] },
      { id: 'u5l2', title: 'if and else', ex: [
        learn('Plan B', 'else is the backup plan. If the test is False, Python runs the else part instead.', `temp = 30\nif temp > 25:\n    print("Ice cream!")\nelse:\n    print("Hot cocoa!")`, 'Ice cream!'),
        predict(`n = 4\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")`, ['even', 'odd', 'even\nodd', '4'], 0, '4 % 2 has no leftover, so the test is True.'),
        predict(`score = 70\nif score >= 90:\n    print("A")\nelif score >= 60:\n    print("B")\nelse:\n    print("C")`, ['B', 'A', 'C', 'A\nB'], 0, 'elif means "else if". Python stops at the first True test.'),
        fill('Make the dog say Woof!', `pet = "dog"\nif pet ___ "dog":\n    print("Woof!")`, ['==', '=', '!'], 0, 'Comparing needs two equals signs.'),
        code('number is 7. Print big if it\'s more than 5, otherwise print small', 'big', `number = 7\nif number > 5:\n    print("big")\nelse:\n    print("small")`, { start: 'number = 7\n', must: ['if', 'else'], hint: 'if number > 5:  then print("big"). Then else:  and print("small"). Indent the print lines!' }),
      ] },
    ],
  },
  {
    id: 'u6', title: 'Loops', emoji: '🔁', color: '#0f9fb0', desc: 'Repeat things without retyping',
    lessons: [
      { id: 'u6l1', title: 'Repeat with for', ex: [
        learn('Loops repeat', 'A for loop repeats the code inside it. range(3) counts 0, 1, 2, so the loop runs 3 times.', `for i in range(3):\n    print("Hip hip hooray!")`, 'Hip hip hooray!\nHip hip hooray!\nHip hip hooray!'),
        predict(`for i in range(3):\n    print(i)`, ['0\n1\n2', '1\n2\n3', '0\n1\n2\n3', '3'], 0, 'range starts at 0 and stops before 3.'),
        mc('How many times does this loop run?', ['5', '4', '6', '1'], 0, 'range(5) gives 0, 1, 2, 3, 4.', `for i in range(5):`),
        predict(`for letter in "hi":\n    print(letter)`, ['h\ni', 'hi', 'h i', 'letter\nletter'], 0, 'A loop over a string visits one letter at a time.'),
        blocks('Build the first line of a loop that repeats 4 times', ['for', 'i', 'in', 'range', '(', '4', ')', ':'], ['while', '5'], 'for i in range( ... ) and finish with a colon.'),
        code('Use a for loop to print Pip! 3 times', 'Pip!\nPip!\nPip!', `for i in range(3):\n    print("Pip!")`, { must: ['for'], hint: 'for i in range(3):  then on the next line, 4 spaces and print("Pip!")' }),
      ] },
      { id: 'u6l2', title: 'Counting and while', ex: [
        learn('Countdown!', 'range(1, 6) starts at 1 and stops before 6. A while loop keeps going as long as its test is True.', `n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Blast off!")`, '3\n2\n1\nBlast off!'),
        predict(`for i in range(1, 4):\n    print(i * 2)`, ['2\n4\n6', '1\n2\n3', '2\n4\n6\n8', '0\n2\n4'], 0, 'i is 1, then 2, then 3.'),
        predict(`total = 0\nfor n in range(1, 5):\n    total = total + n\nprint(total)`, ['10', '4', '15', '1234'], 0, '1 + 2 + 3 + 4'),
        bug('Tap the line with a mistake', ['for i in range(3):', 'print("Go")'], 1, 'The inside of a loop needs 4 spaces in front. That\'s called indenting.'),
        mc('What\'s the problem with this loop?', ['It never stops!', 'It never starts', 'It prints nothing', 'It counts down'], 0, 'x never changes, so x > 0 stays True forever.', `x = 1\nwhile x > 0:\n    print(x)`),
        code('Print the numbers 1 to 5, each on its own line, using a loop', '1\n2\n3\n4\n5', `for i in range(1, 6):\n    print(i)`, { mustAny: ['for', 'while'], hint: 'range(1, 6) gives 1, 2, 3, 4, 5' }),
      ] },
    ],
  },
  {
    id: 'u7', title: 'Lists', emoji: '📋', color: '#e8622c', desc: 'Keep many things in one place',
    lessons: [
      { id: 'u7l1', title: 'Making lists', ex: [
        learn('A list holds many things', 'A list keeps things in order inside [ ]. Get an item by its position number, starting from 0.', `snacks = ["apple", "chips", "grapes"]\nprint(snacks[0])\nprint(len(snacks))`, 'apple\n3'),
        predict(`colors = ["red", "green", "blue"]\nprint(colors[2])`, ['blue', 'green', 'red', 'An error'], 0, 'Count from 0: red is 0, green is 1...'),
        mc('Which one is a list of 3 numbers?', ['[1, 2, 3]', '<1, 2, 3>', '{1-2-3}', '1 2 3'], 0, 'Lists use square brackets and commas.'),
        predict(`pets = ["cat"]\npets.append("dog")\nprint(pets)`, ["['cat', 'dog']", "['dog', 'cat']", "['cat']", 'catdog'], 0, '.append() adds to the end.'),
        fill('Add "milk" to the shopping list', `shop = ["eggs"]\nshop.___("milk")\nprint(shop)`, ['append', 'add', 'push'], 0, 'Lists in Python use .append()'),
        code('Make a list called nums with 4, 8 and 15. Print how many items it has', '3', `nums = [4, 8, 15]\nprint(len(nums))`, { must: ['[', 'len'], hint: 'nums = [4, 8, 15] then print(len(nums))' }),
      ] },
      { id: 'u7l2', title: 'Looping lists', ex: [
        learn('Walk through a list', 'A for loop can visit every item in a list, one at a time.', `animals = ["fox", "owl", "bee"]\nfor a in animals:\n    print("I see a " + a)`, 'I see a fox\nI see a owl\nI see a bee'),
        predict(`nums = [3, 1, 2]\nfor n in nums:\n    print(n * 10)`, ['30\n10\n20', '10\n20\n30', '6', '312'], 0, 'The loop keeps the list\'s order.'),
        predict(`scores = [5, 9, 2]\nprint(max(scores))`, ['9', '5', '2', '16'], 0, 'max finds the biggest.'),
        predict(`letters = ["a", "b", "c", "d"]\nprint(letters[-1])`, ['d', 'a', 'An error', 'c'], 0, '-1 means the last one!'),
        bug('Tap the line with a mistake', ['toys = ["ball", "kite"]', 'print(toys[2])'], 1, 'There are only 2 toys: toys[0] and toys[1]. toys[2] doesn\'t exist!'),
        code('prices = [2, 5, 3]. Print the total using sum()', '10', `prices = [2, 5, 3]\nprint(sum(prices))`, { start: 'prices = [2, 5, 3]\n', must: ['sum'], hint: 'print(sum(prices))' }),
      ] },
    ],
  },
  {
    id: 'u8', title: 'Functions', emoji: '🧩', color: '#c73d3d', desc: 'Invent your own commands',
    lessons: [
      { id: 'u8l1', title: 'Your own command', ex: [
        learn('def makes a function', 'A function is a command you invent. def gives it a name. Call it with ( ) to run it as many times as you like.', `def cheer():\n    print("Go team!")\n\ncheer()\ncheer()`, 'Go team!\nGo team!'),
        predict(`def hi():\n    print("hi")\n\nhi()\nhi()\nhi()`, ['hi\nhi\nhi', 'hi', 'Nothing', 'hi()'], 0, 'Each hi() runs the function once.'),
        mc('Which word starts a function?', ['def', 'fun', 'make', 'function'], 0, 'It\'s short for "define".'),
        learn('Giving it inputs', 'Functions can take inputs called parameters. They go inside the brackets.', `def greet(name):\n    print("Hello " + name)\n\ngreet("Ava")\ngreet("Sam")`, 'Hello Ava\nHello Sam'),
        predict(`def double(n):\n    print(n * 2)\n\ndouble(5)`, ['10', '5', '52', 'n * 2'], 0, 'n becomes 5 inside the function.'),
        bug('Tap the line with a mistake', ['def wave()', '    print("bye bye")', 'wave()'], 0, 'A def line must end with a colon :'),
      ] },
      { id: 'u8l2', title: 'Giving answers back', ex: [
        learn('return', 'return hands an answer back to whoever called the function, so you can keep using it.', `def add(a, b):\n    return a + b\n\nresult = add(2, 3)\nprint(result)`, '5'),
        predict(`def square(x):\n    return x * x\n\nprint(square(4))`, ['16', '8', '44', 'x * x'], 0, '4 × 4'),
        predict(`def bigger(a, b):\n    if a > b:\n        return a\n    return b\n\nprint(bigger(3, 9))`, ['9', '3', '12', 'True'], 0, 'Is 3 > 9? No, so it returns b.'),
        fill('Make triple give its answer back', `def triple(n):\n    ___ n * 3\n\nprint(triple(2))`, ['return', 'print', 'give'], 0, 'Which word hands the answer back?'),
        code('Write add_one(n) that returns n + 1, then print add_one(9)', '10', `def add_one(n):\n    return n + 1\n\nprint(add_one(9))`, { start: 'def add_one(n):\n    \n\nprint(add_one(9))', must: ['def', 'return'], hint: 'Inside the function: return n + 1' }),
      ] },
    ],
  },
];

// Advanced units on the roadmap, shown locked on the path.
const COMING = [
  { title: 'Dictionaries', emoji: '📖', desc: 'Look things up by name' },
  { title: 'Objects and classes', emoji: '🏗️', desc: 'Build your own things' },
  { title: 'Make a game', emoji: '🎮', desc: 'Put it all together' },
];
