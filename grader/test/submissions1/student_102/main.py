# Name: Jordan Williams
# Date Assigned: 09/05/2024
# Course: 2000-002
# Date Due: 09/12/2024
# File name: main.py
# Program Description: Menu program for dessert and drinks. Gets input from user and calculates total with tax. No if statements used.

print("=====================")
print("Create Your Dessert")
print("=====================")
print("---------------------")
print("Dessert Options")
print("---------------------")
print("1. Ice cream")
print("$1.00")
print("2. Pie Slice")
print("$2.00")
print("3. Smoothie")
print("$3.00")

d_choice = int(input("Enter dessert choice: "))

print("---------------------")
print("Flavor Options")
print("---------------------")
print("1. Strawberry")
print("$0.25")
print("2. Chocolate")
print("$0.50")
print("3. Raspberry")
print("$0.75")

f_choice = int(input("Enter flavor choice: "))
print("=-=-=-=-=-=-=-=-=-=-=-=")
print("---------------------")
print("Drink Options")
print("---------------------")
print("1. Water")
print("$1.25")
print("2. Tea")
print("$2.50")
print("3. Soda")
print("$3.75")

dr_choice = int(input("Enter drink choice: "))
print("---------------------")
print("Flavor Options")
print("---------------------")
print("1. Orange")
print("$0.25")
print("2. Lemon")
print("$0.50")
print("3. Strawberry")
print("$0.75")

dr_flavor = int(input("Enter flavor choice: "))

# calc prices
d_price = d_choice * 1.00 + f_choice * 0.25
dr_price = dr_choice * 1.25 + dr_flavor * 0.25
sub = d_price + dr_price
tax = sub * 0.11
tot = sub + tax

print("=====================")
print("Receipt")
print("=====================")
print("Dessert")
print("$" + str(d_price))
print("Drink")
print("$" + str(dr_price))
print("---------------------")
print("Subtotal")
print("$" + str(sub))
print("Tax")
print("$" + str(tax))
print("---------------------")
print("Total")
print("$" + str(tot))
