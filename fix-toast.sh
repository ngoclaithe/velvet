#!/bin/bash

# Comment out all toast related calls in auth pages
find src/app/\(auth\)/ -name "*.tsx" -exec sed -i 's/toast({/\/\/ toast({/g' {} \;
find src/app/\(auth\)/ -name "*.tsx" -exec sed -i 's/^      })/      \/\/ })/g' {} \;

echo "Fixed toast calls in auth pages"
