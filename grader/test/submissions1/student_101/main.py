# Name: Marcus Chen
# Date Assigned: 09/05/2024
# Course: 2000-002
# Date Due: 09/12/2024
# File name: main.py
#
# Program Description: Creates a dessert and drink menu. User picks options
# and flavors, program prints a receipt with subtotal, tax, and total.

TAX_RATE = 0.11

def main():
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
    dessert_choice = int(input("Enter dessert choice: "))

    print("---------------------")
    print("Flavor Options")
    print("---------------------")
    print("1. Strawberry")
    print("$0.25")
    print("2. Chocolate")
    print("$0.50")
    print("3. Raspberry")
    print("$0.75")
    flavor_choice = int(input("Enter flavor choice: "))

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
    drink_choice = int(input("Enter drink choice: "))

    print("---------------------")
    print("Flavor Options")
    print("---------------------")
    print("1. Orange")
    print("$0.25")
    print("2. Lemon")
    print("$0.50")
    print("3. Strawberry")
    print("$0.75")
    drink_flavor_choice = int(input("Enter flavor choice: "))

    # price from choice number (no if statements)
    dessert_price = dessert_choice * 1.00 + flavor_choice * 0.25
    drink_price = drink_choice * 1.25 + drink_flavor_choice * 0.25
    subtotal = dessert_price + drink_price
    tax = subtotal * TAX_RATE
    total = subtotal + tax

    print("=====================")
    print("Receipt")
    print("=====================")
    print("Dessert")
    print(f"${dessert_price}")
    print("Drink")
    print(f"${drink_price}")
    print("---------------------")
    print("Subtotal")
    print(f"${subtotal}")
    print("Tax")
    print(f"${tax}")
    print("---------------------")
    print("Total")
    print(f"${total}")

if __name__ == "__main__":
    main()
