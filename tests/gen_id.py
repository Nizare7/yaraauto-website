def generate_car_id(brand, model_name, year, mileage, date_added=None):
    """
    Genera un ID univoco per un'auto nel formato: brand-XXXXXXXX1025
    
    Args:
        brand (str): Nome della marca (es. "Toyota", "Fiat")
        model_name (str): Nome del modello (es. "Panda", "Yaris")
        year (int): Anno dell'auto (es. 2020)
        mileage (int): Chilometraggio (es. 35000)
        date_added (str): Data aggiunta in formato "MMYY" (default: "1025")
    
    Returns:
        str: ID generato
    """
    import re
    
    # 1. BRAND: converti in lowercase
    brand_part = brand.lower()
    
    # 2. PRIME 3 LETTERE DAL NOME DEL MODELLO
    # Rimuovi spazi e caratteri speciali
    clean_name = re.sub(r'[^a-zA-Z]', '', model_name.lower())
    
    # Estrai consonanti
    consonants = re.sub(r'[aeiou]', '', clean_name)
    # Estrai vocali
    vowels = re.sub(r'[bcdfghjklmnpqrstvwxyz]', '', clean_name)
    
    # Prendi prima le consonanti, poi le vocali se necessario
    name_letters = (consonants + vowels)[:3]
    
    # Se non bastano ancora, usa le prime lettere del nome
    if len(name_letters) < 3:
        name_letters = clean_name[:3]
    
    # Completa con 'x' se ancora troppo corto
    name_part = name_letters.ljust(3, 'x')
    
    # 3. ANNO (ultime 2 cifre)
    year_part = str(year)[-2:]  # es. 2020 -> "20"
    
    # 4. CHILOMETRAGGIO (prime 3 cifre)
    mileage_str = str(mileage)
    mileage_part = mileage_str[:3].ljust(3, '0')  # es. 35000 -> "350", 5000 -> "500"
    
    # 5. DATA AGGIUNTA (default ottobre 2025)
    if date_added is None:
        date_part = "1025"  # ottobre 2025
    else:
        date_part = date_added
    
    # 6. COMBINA TUTTO
    car_id = f"{brand_part}-{name_part}{year_part}{mileage_part}{date_part}"
    
    return car_id

# ESEMPI DI UTILIZZO:
print(generate_car_id("Fiat", "Panda", 2020, 35000))
# Output: fiat-pnd203501025

print(generate_car_id("Toyota", "Yaris", 2022, 15000))
# Output: toyota-yrs221501025

print(generate_car_id("Mercedes", "Classe C 220", 2010, 164000))
# Output: mercedes-cls101641025

print(generate_car_id("Mini", "One", 2011, 239000))
# Output: mini-one112391025