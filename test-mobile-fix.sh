#!/bin/bash

# Test script per verificare che tutti i file siano presenti

echo "🔍 Verifica Fix Glitching Mobile..."
echo ""

errors=0

# Verifica file CSS
if [ -f "styles/ios-fixes.css" ]; then
    echo "✅ ios-fixes.css presente"
else
    echo "❌ ios-fixes.css MANCANTE"
    ((errors++))
fi

if [ -f "styles/mobile.css" ]; then
    echo "✅ mobile.css presente"
else
    echo "❌ mobile.css MANCANTE"
    ((errors++))
fi

if [ -f "styles/cars.css" ]; then
    echo "✅ cars.css presente"
else
    echo "❌ cars.css MANCANTE"
    ((errors++))
fi

# Verifica file JS
if [ -f "scripts/mobile-fixes.js" ]; then
    echo "✅ mobile-fixes.js presente"
else
    echo "❌ mobile-fixes.js MANCANTE"
    ((errors++))
fi

if [ -f "scripts/script.js" ]; then
    echo "✅ script.js presente"
else
    echo "❌ script.js MANCANTE"
    ((errors++))
fi

# Verifica inclusione in HTML
echo ""
echo "🔍 Verifica inclusione ios-fixes.css nelle pagine HTML..."

if grep -q "ios-fixes.css" pages/auto.html; then
    echo "✅ ios-fixes.css incluso in auto.html"
else
    echo "❌ ios-fixes.css NON incluso in auto.html"
    ((errors++))
fi

if grep -q "ios-fixes.css" pages/homepage.html; then
    echo "✅ ios-fixes.css incluso in homepage.html"
else
    echo "❌ ios-fixes.css NON incluso in homepage.html"
    ((errors++))
fi

# Verifica inclusione mobile-fixes.js
if grep -q "mobile-fixes.js" pages/auto.html; then
    echo "✅ mobile-fixes.js incluso in auto.html"
else
    echo "❌ mobile-fixes.js NON incluso in auto.html"
    ((errors++))
fi

if grep -q "mobile-fixes.js" pages/homepage.html; then
    echo "✅ mobile-fixes.js incluso in homepage.html"
else
    echo "❌ mobile-fixes.js NON incluso in homepage.html"
    ((errors++))
fi

echo ""
if [ $errors -eq 0 ]; then
    echo "🎉 Tutti i controlli passati!"
    echo ""
    echo "📱 Testa ora su iPhone 12:"
    echo "   1. Apri Safari su iPhone"
    echo "   2. Vai alla pagina auto.html"
    echo "   3. Scrolla velocemente"
    echo "   4. Verifica che le card NON scompaiano"
    echo ""
    echo "🔍 Console messages attesi:"
    echo "   - 'Mobile performance fixes applied'"
    echo "   - 'Mobile fixes: Final repaint completed'"
    exit 0
else
    echo "❌ Trovati $errors errori!"
    exit 1
fi
