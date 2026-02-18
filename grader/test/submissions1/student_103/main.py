# Name: Alex Rivera
# Date Assigned: 09/06/2024
# Course: 2000-004
# Date Due: 09/13/2024
# File name: main.py
#
# Program Description: Dessert and drink order program. No if statements -
# uses math to get the right price. Shows receipt at the end.

def show_menu(title, options, prices):
    """Print a menu section with title and numbered options."""
    print("---------------------")
    print(title)
    print("---------------------")
    for i in range(len(options)):
        print(str(i + 1) + ". " + options[i])
        print("$" + str(prices[i]))

def run():
    DESSERTS = ["Ice cream", "Pie Slice", "Smoothie"]
    DESSERT_PRICES = [1.00, 2.00, 3.00]
    FLAVORS_D = ["Strawberry", "Chocolate", "Raspberry"]
    FLAVOR_PRICES = [0.25, 0.50, 0.75]
    DRINKS = ["Water", "Tea", "Soda"]
    DRINK_PRICES = [1.25, 2.50, 3.75]
    FLAVORS_DR = ["Orange", "Lemon", "Strawberry"]

    print("=====================")
    print("Create Your Dessert")
    print("=====================")
    show_menu("Dessert Options", DESSERTS, DESSERT_PRICES)
    choice1 = int(input("Enter dessert choice: "))
    show_menu("Flavor Options", FLAVORS_D, FLAVOR_PRICES)
    choice2 = int(input("Enter flavor choice: "))

    print("=-=-=-=-=-=-=-=-=-=-=-=")
    show_menu("Drink Options", DRINKS, DRINK_PRICES)
    choice3 = int(input("Enter drink choice: "))
    show_menu("Flavor Options", FLAVORS_DR, FLAVOR_PRICES)
    choice4 = int(input("Enter flavor choice: "))

    # formula: option price + flavor price (no if/else)
    dessert_total = choice1 * 1.0 + choice2 * 0.25
    drink_total = choice3 * 1.25 + choice4 * 0.25
    before_tax = dessert_total + drink_total
    tax_amt = before_tax * 0.11
    final_total = before_tax + tax_amt

    print("=====================")
    print("Receipt")
    print("=====================")
    print("Dessert")
    print("$" + str(dessert_total))
    print("Drink")
    print("$" + str(drink_total))
    print("---------------------")
    print("Subtotal")
    print("$" + str(before_tax))
    print("Tax")
    print("$" + str(tax_amt))
    print("---------------------")
    print("Total")
    print("$" + str(final_total))

if __name__ == "__main__":
    run()
