function deepEqual(obj1, obj2) {
	if (obj1 === obj2) return true;
  
	if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
	  return false;
	}
  
	let keys1 = Object.keys(obj1);
	let keys2 = Object.keys(obj2);
  
	if (keys1.length !== keys2.length) return false;
  
	for (let key of keys1) {
	  if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
	}
  
	return true;
  }
  
  // Example usage
  const obj1 = {
	a: 'b',
	c: {
	  d: 'e',
	  f: {
		g: 'a'
	  }
	}
  };
  
  const obj2 = {
	a: 'b',
	c: {
	  d: 'e',
	  f: {
		g: 'h'
	  }
	}
  };
  
  console.log(deepEqual(obj1, obj2)); // true
  
  const obj3 = {
	a: 'b',
	c: {
	  d: 'e',
	  f: {
		g: 'i' // different value
	  }
	}
  };
  
  console.log(deepEqual(obj1, obj3)); // false
  