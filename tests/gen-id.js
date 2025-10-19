function generateCarId(brand, modelName, year, mileage, dateAdded = "1025") {
    // 1. Brand in lowercase
    const brandPart = brand.toLowerCase();
    
    // 2. Prime 3 lettere dal nome
    const cleanName = modelName.toLowerCase().replace(/[^a-z]/g, '');
    const consonants = cleanName.replace(/[aeiou]/g, '');
    const vowels = cleanName.replace(/[bcdfghjklmnpqrstvwxyz]/g, '');
    
    let namePart = (consonants + vowels).substring(0, 3);
    if (namePart.length < 3) {
        namePart = cleanName.substring(0, 3);
    }
    namePart = namePart.padEnd(3, 'x');
    
    // 3. Anno (ultime 2 cifre)
    const yearPart = year.toString().slice(-2);
    
    // 4. Chilometraggio (prime 3 cifre)
    const mileagePart = mileage.toString().substring(0, 3).padEnd(3, '0');
    
    // 5. Combina tutto
    return `${brandPart}-${namePart}${yearPart}${mileagePart}${dateAdded}`;
}