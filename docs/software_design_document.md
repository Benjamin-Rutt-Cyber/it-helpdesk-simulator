# Software Design Document

## Project Name: XXXX

## Group Number: 13

## Team members

| Student Number | Name                |
| -------------- | ------------------- |
| s5316050       | Benjamin Rutt       |
| s222222        | Full name           |
| s5392217       | Nguyen Anh Dung Bui |
| s5262774       | Ryan Bigg           |

<div style="page-break-after: always;"></div>

# Table of Contents

<!-- TOC -->

- [Table of Contents](#table-of-contents)
  - [1. System Vision](#1-system-vision)
    - [1.1 Problem Background](#11-problem-background)
    - [1.2 System capabilities/overview](#12-system-capabilitiesoverview)
    - [1.3 Potential Benefits](#13potential-benefits)
  - [2. Requirements](#2-requirements)
    - [2.1 User Requirements](#21-user-requirements)
    - [2.2 Software Requirements](#22software-requirements)
    - [2.3 Use Case Diagrams](#23-use-case-diagrams)
    - [2.4 Use Cases](#24-use-cases)
  - [3. Software Design and System Components](#3-software-design-and-system-components-)
    - [3.1 Software Design](#31software-design)
    - [3.2 System Components](#32system-components)
      - [3.2.1 Functions](#321-functions)
      - [3.2.2 Data Structures / Data Sources](#322-data-structures--data-sources)
      - [3.2.3 Detailed Design](#323-detailed-design)
  - [4. User Interface Design](#4-user-interface-design)
  _ [4.1 Structural Design](#41-structural-design)
  _ [4.2 Visual Design](#42visual-design)
  <!-- TOC -->

<div style="page-break-after: always;"></div>

## 1. System Vision

### 1.1 Problem Background

Problem Identification: The system attempts to address the challenge of quickly obtaining, evaluating, and visualizing nutritional data for different food products. When looking for comprehensive and trustworthy nutritional information, users frequently have trouble finding what they need. This tool helps users better comprehend the nutritional content and quality of different foods by offering a desktop program that makes data analysis and visualization easier. This enables users to make more educated decisions about their diet and overall health.

Dataset: The dataset includes detailed nutritional information for various food items. Each food entry contains data on:

Food

Caloric Value

Fats (Total, Saturated, Monounsaturated, Polyunsaturated) (in g)

Saturated Fats (in g)

Monounsaturated Fats (in g)

Polyunsaturated Fats (in g)

Carbohydrates (Total, Sugars)

Protein (in g)

Sugars (in g)

Dietary Fiber (in g)

Cholesterol (in mg)

Sodium (in g)

Water (in g)

Various Vitamins (A, B1, B11, B12, B2, B3, B5, B6, C, D, E, K) (in mg)

Minerals (Calcium, Copper, Iron, Magnesium, Manganese, Phosphorus, Potassium, Selenium, Zinc) (in mg)

Nutrition Density (a metric indicating the nutrient richness per calorie)

Data Input/Output:

- Input: The user inputs will include:

             + Search queries for specific food items.

             + Selection of food items for detailed nutritional breakdown analysis.

             + Inputting minimum and maximum values for filtering nutritional content ranges.

             + Selection of nutritional content levels for filtering (Low, Mid, High).

- Output: The system will output:

            + Nutritional information of specific food items.

            + Visualizations like pie charts and bar graphs for nutritional breakdowns.

            + Lists of foods filtered by nutritional range or level.

Target Users: The target users of the system are:

- Nutritionists and Dietitians: Professionals who need quick access to comprehensive nutritional data to design meal plans.

- Health-Conscious Individuals: People who want to analyze their dietary choices to maintain or improve their health.

- Fitness Enthusiasts and Athletes: Individuals who monitor their diet closely for optimized performance and health.

- Researchers and Students: Those involved in food science, health, and nutrition studies who need to analyze large sets of data.

### 1.2 System capabilities/overview

- System Functionality: A graphical user interface will be made available by the system to facilitate the searching, filtering, analysis, and visualization of nutritional information related to various foods. It will make it simple for users to obtain and comprehend complicated nutritional information by enabling meaningful interactions with the dataset.

- Features and Functionalities:

         1)  Food Search:

Enables users to look for food items by name and shows all of the nutritional data associated with the food they have chosen.

         2)  Nutrition Breakdown:

Allows users to choose a certain dish and see how various nutrients are broken down. This feature makes the makeup of lipids, carbs, proteins, and other nutrients easily understood visually.

         3)  Nutrition Range Filter:

Enables users to filter items by establishing minimum and maximum amounts of a certain ingredient (such as protein or fat). A list of meals that fit within the given range will be shown by the system, making it simpler to locate appropriate selections depending on certain dietary requirements.

         4)  Nutrition Level Filter:

Gives consumers the choice to filter food items based on their low, mid, or high nutritional content levels. Users can discover meals with desired nutritional qualities by using these predefined percentages (For example: less than 33%, 33-66%, and higher than 66%) in relation to the greatest value of each nutrient.

         5)  Custom Feature – Nutrition Comparison Tool:

Let users choose different foods and view side-by-side comparisons of their nutritional values. This feature will present comparison visualizations (such as tables and bar charts) that highlight variations in important nutrients, assisting users in making better informed dietary decisions.

This feature enhances value by enabling customers to compare numerous meals directly and make well-informed decisions.

        6) Settings

<span style="color:red"> Allows the user to change features on the application. The user can change the unit from imperial to metrics and vice versa. Able to change the theme from light to dark and vice versa and is also able to change the language from english to; Spanish, Indian or Chinese.</span>

### 1.3 Benefit Analysis

How will this system provide value or benefit?

1. Ease of Access to Nutritional Information: Compared to manually searching through several sources for information, users may save time and effort by using the system's user-friendly interface to acquire detailed nutritional data for a variety of meals.

2. Enhanced Data Visualization: Pie charts and bar graphs are examples of visual data representations that make complicated nutritional information easier for consumers to understand and comprehend, which improves the analysis's intuition and insight.

3. Customized Filtering and Analysis: Users may customize their search and analysis based on their own dietary needs or preferences by utilizing options such as the Nutrition Level Filter and Nutrition Range Filter. The tool's usefulness and user experience are enhanced by this modification.

4. Comparative Analysis for Better Decision-Making: With the help of the Nutrition Comparison Tool, consumers can compare various food products side by side and have a clear understanding of what makes a better diet plan for managing weight, achieving fitness objectives, or treating medical illnesses.

5. Support for Health and Wellness Goals: The system assists users in reaching their health and wellness objectives, such as controlling weight, lowering cholesterol, or improving nutrient intake, by offering a thorough tool that addresses a broad variety of nutritional indicators.

- All things considered, anyone looking to learn more about the nutritional content of their food may use this data analysis and visualization tool to help them make better, more educated decisions.

## 2. Requirements

### 2.1 User Requirements

Detail how users are expected to interact with or use the program. What functionalities must the system provide from the end-user perspective? This can include both narrative descriptions and a listing of user needs.

The main user of the desktop application will be a dietician who will use the application for their clients, they will be able to interact with the application by being able to filter the data and display graphs so that they can be used to help their clients with their dietary needs. The user must first be able to access the application through their desktop or laptop. The user will need to be able to search for foods by name and display all the nutritional information. The user will also need to be able to choose one food and display pie charts and bar graphs showing the breakdown of different nutrients for the selected food. The application can allow the user to choose one of the nutrition and input minimum and maximum values, and the application will be able to display a list of the foods that fall within those ranges. The application will allow the user to filter by nutritional content levels: low, medium, and high (including fat, protein, carbohydrates, sugar, and nutritional density). The three levels are defined as follows:

- Low: Less than 33% of the highest value.

- Mid: Between 33% and 66% of the highest value.

- High: Greater than 66% of the highest value.

The final feature of the application will allow the dietician to select any number of foods and then calculate the total caloric intake as well as the main nutritional information.

### 2.2 Software Requirements

Define the functionality the software will provide. This section should list requirements formally, often using the word "shall" to describe functionalities.

**R1.1:** The application shall allow the dietician to access the application through their desktop or laptop.

**R1.2:** The application shall allow the user to authenticate their credentials before access to the software.

**R2.1:** The application shall allow the dietician to search for foods by name.

**R2.2:** The application shall display all nutritional information for a selected food item.

**R3.1:** The application shall allow the dietician to choose one food and display a pie chart showing the breakdown of different nutrients for the selected food.

**R3.2:** The application shall allow the dietician to choose one food and display bar graphs showing the breakdown of different nutrients for the selected food.

**R4.1:** The application shall allow the dietician to select one nutrient and input minimum and maximum values.

**R4.2:** The application shall display a list of foods that fall within the specified range for the selected nutrient.

**R5.1:** The application shall allow the dietician to filter foods by nutritional different content levels (low, medium, and high).

**R6.1:** The application shall allow the dietician to select any number of foods and calculate the total caloric intake.

### 2.3 Use Case Diagram

Provide a system-level Use Case Diagram illustrating all required features.

![Use Case Diagram](./UseCaseDiagram.png)

### 2.4 Use Cases

Include at least 5 use cases, each corresponding to a specific function.

| **Use Case ID**    | 1                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case Name**  | Food search                                                                                                                                                                                                                                                               |
| **Actors**         | User                                                                                                                                                                                                                                                                      |
| **Description**    | The user can search for a food item and all nutritional information relating to the food item.                                                                                                                                                                            |
| **Flow of Events** | 1. The user enters the name of the food into a search bar. <br>2. The application filters the database using the searched item.<br>3. The application displays a list of foods that matches the search<br>4. The user can select a food item to view detailed information |
| **Alternate Flow** | If no results match the search query, the system displays a "No Results Found" message                                                                                                                                                                                    |

| **Use Case ID**    | 2                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case Name**  | Nutrition Breakdown                                                                                                                     |
| **Actors**         | User                                                                                                                                    |
| **Description**    | The user views a detailed breakdown of the nutritional information for a selected food item.                                            |
| **Flow of Events** | 1. The user selects a food item. <br> 2. The application displays detailed nutrition information relating to the food that is selected. |
| **Alternate Flow** | If the selected food item has incomplete nutrition information, the application will alert the user of the missing information.         |

| **Use Case ID**    | 3                                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case Name**  | Nutrition Range Filter                                                                                                                                                                                                                       |
| **Actors**         | User                                                                                                                                                                                                                                         |
| **Description**    | The user applies filters to search for food items that fall within specific nutritional ranges.                                                                                                                                              |
| **Flow of Events** | 1. The user selects the "Nutrition Range Filter" option. <br> 2. The system prompts the user to input minimum and maximum values. <br> 3. The system filters the database and displays a list of food items that match the specified ranges. |
| **Alternate Flow** | If no food items match the specified nutritional ranges, the system displays a "No Results Found" message.                                                                                                                                   |

| **Use Case ID**    | 4                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case Name**  | Nutrition Level Filter                                                                                                                                                                                                        |
| **Actors**         | User                                                                                                                                                                                                                          |
| **Description**    | The user filters food items based on a specific nutritional level.                                                                                                                                                            |
| **Flow of Events** | 1. The user selects the "Nutrition Level Filter" option. <br> 2. The user chooses from the list of predefined nutritional levels. <br> 3. The system filters and displays food items that meet the selected nutrition levels. |
| **Alternate Flow** | If no food items meet the selected nutritional levels, the system displays a "No Results Found" message.                                                                                                                      |

| **Use Case ID**    | 5                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case Name**  | Total Food Calorie Calculator                                                                                                                                                                                 |
| **Actors**         | User                                                                                                                                                                                                          |
| **Description**    | The application calculates the total calories from one or more selected foods.                                                                                                                                |
| **Flow of Events** | 1. The user selects one or more food items. <br> 2. The user clicks the “Calculate total calories” button <br> 3. The system calculates and displays the total calorie count from the list of selected foods. |
| **Alternate Flow** | If no food items are selected, the system prompts the user to select at least one item before performing the calculation.                                                                                     |

## 3. Software Design and System Components

### 3.1 Software Design

Include a flowchart that illustrates how your software will operate.

Example:  
![Software Design](./software_design_flowchart.png)

### 3.2 System Components

#### 3.2.1 Functions

Below is a list of key functions within the software, including their descriptions, input parameters, return values, and side effects:

1. Search food by name:

- Description: Searches for food items by name and retrieves all relevant nutritional information.

- Input Parameters:

* Food name (string): The name of the food item to search for.

- Return value: A list of dictionaries with the corresponding foods' nutritional values listed.

- Side Effects: None

2. Get nutrition Breakdown:

- Description: Retrieves the nutritional breakdown of a selected food and generates information about the food item or consumption item.

- Input Parameters:

* Food ID (integer): Unique identifier of the food item.

- Return Value: A dictionary that contains information for visualizations, including the pathways or objects for the created charts and the percentages of nutrients.

- Side Effects: May save visualizations to a temporary directory or memory.

3. Filter foods by Nutrition Range:

- Description: Filters food products according to a range of defined nutrients, such protein, fat, etc.

- Input Parameters:

* Nutrient (string): example: fat, protein....

* Min value (Float): The minimum value of the nutrient range.

* Max value (Float): The maximum value of the nutrient range.

- Return Value: A list of food items that fall within the specified nutrient range.

- Side Effects: None.

4. Filter foods by nutrition level:

- Description: Filters foods by nutritional content levels (low, mid, high) for nutrients like fat, protein, carbohydrates, sugar, and nutrition density.

- Input Parameters:

* nutrient (String): The type of nutrient to filter by.

* level (String): The nutritional level ("low", "mid", "high").

- Return Value: A list of food items that match the specified nutrient level.

- Side Effects: None.

5. Compare foods nutritional content

- Description: Compares the nutritional content of multiple food items and generates side-by-side visualizations.

- Input Parameters:

* Food ids (List of Integers): List of unique identifiers for the food items to compare.

- Return Value: A dictionary containing comparative visualization data (e.g., bar chart data).

- Side Effects: May generate and save visualizations to a temporary directory.

6. Load data from csv:

- Description: Loads nutritional data from a CSV file into the system for processing.

- Input Parameters:

* File path (String): The file path of the CSV file containing nutritional data.

- Return Value: A list of dictionaries containing nutritional data.

- Side Effects: Loads data into a global or class-level data structure.

7. Export visualization:

- Description: Exports generated visualizations to a user-specified location.

- Input Parameters:

* Visualization (Object): The visualization object to be exported.

* File path (String): The path where the visualization will be saved.

- Return Value: A Boolean indicating success or failure.

- Side Effects: Saves visualization files to the specified location on disk.

8. Calculate nutrient density:

- Description: Calculates the nutrient density of a food item based on its nutrient content per calorie.

- Input Parameters:

* Food data (Dictionary): A dictionary containing all nutritional information of a food item.

- Return Value: A float representing the nutrient density score.

- Side Effects: None.

#### 3.2.2 Data Structures / Data Sources

1. Food data

- Type: List of Dictionaries

- Usage: Stores the main dataset of food items, where each dictionary contains nutritional information for a food item (e.g., calories, fats, vitamins).

- Functions: Utilized by search_food_by_name, get_nutrition_breakdown, filter_foods_by_nutrition_range, filter_foods_by_nutrition_level, compare_foods_nutritional_content, calculate_nutrient_density.

2. Selected food data

- Type: Dictionary

- Usage: Temporarily stores data for a single selected food item to facilitate visualizations and detailed analysis.

- Functions: Utilized by get_nutrition_breakdown, compare_foods_nutritional_content.

3. Visualization data

- Type: Dictionary or Object

- Usage: Stores data needed to create visualizations (e.g., nutrient percentages for pie charts, bar chart values) and may include metadata such as file paths.

- Functions: Utilized by get_nutrition_breakdown, compare_foods_nutritional_content, and export_visualization.

4. User preferences

- Type: Dictionary

- Usage: Stores user preferences, such as selected nutrient ranges, food items for comparison, and export paths for visualizations.

- Functions: Utilized by filter_foods_by_nutrition_range, filter_foods_by_nutrition_level, and export_visualization.

5. Nutrition ranges

- Type: Dictionary

- Usage: Contains predefined ranges for nutrition levels (low, mid, high) based on maximum values in the dataset.

- Functions: Utilized by filter_foods_by_nutrition_level to determine which foods fall within each level.

6. Csv data source

- Type: File (CSV)

- Usage: The source file that contains the initial nutritional data, which is read and loaded into the food_data structure.

- Functions: Utilized by load_data_from_csv to populate the food_data structure.

#### 3.2.3 Detailed Design

Provide pseudocode or flowcharts for all functions listed in Section 3.2.1 that operate on data structures. For instance, include pseudocode or a flowchart for a custom searching function.

1. Search Food By Name

- Description: Searches for food items by name and <span style="color:red"> or keyword (i.e. chese) </span> retrieves all relevant nutritional information.
- Pseudocode:
  Function search_food_by_name(food_name: String) -> List[Dictionary]
  Initialize result_list as an empty list
  For each food_item in food_data:
  If food_name is a substring of food_item["Food"]:
  Append food_item to result_list
  End For
  Return result_list
  End Function

2. Get Nutrition Breakdown

- Description: Retrieves the nutritional breakdown of a selected food and generates pie charts and bar graphs.
- Pseudocode:
  Function get_nutrition_breakdown(food_id: Integer) -> Dictionary
  Initialize selected_food as an empty dictionary
  For each food_item in food_data:
  If food_item["id"] == food_id:
  Set selected_food to food_item
  Break the loop
  End For

      If selected_food is empty:
          Return empty dictionary

      Initialize breakdown_data as an empty dictionary
      Set breakdown_data["nutrients"] to the relevant nutrient values from selected_food

      Generate pie chart using breakdown_data["nutrients"]
      Generate bar graph using breakdown_data["nutrients"]

      Set breakdown_data["pie_chart"] to generated pie chart
      Set breakdown_data["bar_graph"] to generated bar graph

      Return breakdown_data

  End Function

3. Filter Foods By Nutrition Range

- Description: Filters food items based on a specified nutrient range.
- Pseudocode:
  Function filter_foods_by_nutrition_range(nutrient: String, min_value: Float, max_value: Float) -> List[Dictionary]
  Initialize result_list as an empty list
  For each food_item in food_data:
  If food_item[nutrient] >= min_value AND food_item[nutrient] <= max_value:
  Append food_item to result_list
  End For
  Return result_list
  End Function

4. Filter Foods By Nutrition Level

- Description: Filters foods by nutritional content levels (low, mid, high).
- Pseudocode:
  Function filter_foods_by_nutrition_level(nutrient: String, level: String) -> List[Dictionary]
  Initialize result_list as an empty list
  Get max_value for nutrient from nutrition_ranges

      If level == "low":
          threshold = max_value * 0.33
          For each food_item in food_data:
              If food_item[nutrient] < threshold:
                  Append food_item to result_list
          End For

      Else If level == "mid":
          min_threshold = max_value * 0.33
          max_threshold = max_value * 0.66
          For each food_item in food_data:
              If food_item[nutrient] >= min_threshold AND food_item[nutrient] <= max_threshold:
                  Append food_item to result_list
          End For

      Else If level == "high":
          threshold = max_value * 0.66
          For each food_item in food_data:
              If food_item[nutrient] > threshold:
                  Append food_item to result_list
          End For

      Return result_list

  End Function

5. Compare Foods Nutritional Content

- Description: Compares the nutritional content of multiple food items and generates side-by-side visualizations.
- Pseudocode:
  Function compare_foods_nutritional_content(food_ids: List[Integer]) -> Dictionary
  Initialize comparison_data as an empty dictionary
  For each food_id in food_ids:
  Initialize food_data_dict as an empty dictionary
  For each food_item in food_data:
  If food_item["id"] == food_id:
  Set food_data_dict to food_item
  Break the loop
  End For
  Add food_data_dict to comparison_data
  End For

      Generate bar chart using comparison_data
      Set comparison_data["bar_chart"] to generated bar chart

      Return comparison_data

  End Function

6. Load data from csv

- Description: Loads nutritional data from a CSV file into the system for processing.
- Pseudocode:
  Function load_data_from_csv(file_path: String) -> List[Dictionary]
  Initialize data_list as an empty list
  Open CSV file located at file_path
  For each row in the CSV file:
  Convert row to a dictionary
  Append the dictionary to data_list
  End For
  Return data_list
  End Function

7. Export Visualization

- Description: Exports generated visualizations to a user-specified location.
- Pseudocode:
  Function export_visualization(visualization: Object, file_path: String) -> Boolean
  Try:
  Save visualization object to file_path
  Return True
  Catch Exception e:
  Print error message e
  Return False
  End Function

8. Calculate Nutrient Density

- Description: Calculates the nutrient density of a food item based on its nutrient content per calorie.
- Pseudocode:
  Function calculate_nutrient_density(food_data: Dictionary) -> Float
  Initialize total_nutrients as 0
  For each nutrient in food_data (excluding "Calories"):
  Add nutrient value to total_nutrients
  End For
  If food_data["Calories"] is not 0:
  Return total_nutrients / food_data["Calories"]
  Else:
  Return 0
  End Function

## 4. User Interface Design

### 4.1 Structural Design

#### Structure:

The software is structured around a series of main features and supporting pages that allow the user to search, filter, analyze, and visualize nutritional data from the food database. Here’s a hierarchical view of the structure:

#### Home Page

- Title: "Nutritional Food Database"
- Search bar
- Buttons for: Range Filter, Level Filter, Settings
- Search Results Section (appears when typing or when food is found)

##### Food Search

- Search bar
- Search results (displays matching foods)
- Clicking a food result takes the user to the Food Details Page.

##### Food Details Page

- Displays full nutritional information for a selected food.
- Options for: Nutritional Breakdown, Return to Search, Apply Filters.

##### Nutritional Breakdown Page

- Pie charts and bar graphs showing nutrient breakdown for the selected food.
- Visual representation of key nutritional values (calories, protein, fat, etc.).

##### Filter Search Pages

- Range Filter Page: Allows users to enter a range of values (e.g., protein between 10-20g) and filters food based on these criteria.
- Level Filter Page: Lets users filter foods into "Low," "Mid," or "High" categories for fat, protein, carbs, sugar, and nutritional density.

##### Settings Page

- Options for: Theme (light/dark), Unit of Measure (imperial/metric), Language.
- Data management options (reset settings to default)

#### Information Grouping:

- Home Page: Simple layout focusing on the search function, filters, and quick access to settings.
- Food Search: Organized by the name of food items, allowing users to easily search for specific foods and view the nutritional data.
- Nutritional Breakdown: Focused entirely on visual representation, with graphs and charts to make complex data easily interpretable.
- Filter Pages: Information is grouped by user-defined ranges or nutritional categories, making it easy to narrow down food choices.
- Settings: Grouped logically with options for user preferences (e.g., theme, units, language).

The key to this grouping is simplicity and clarity—the information is broken down into logical sections that reflect user needs (searching, analyzing, filtering, and customizing settings).

#### Navigation:

- Sidebar Navigation Menu on all screens, containing:
  - Home
    - Range Filter
    - Level Filter
    - Settings
- Search Bar: Present on the home page for immediate interaction.
- Back Navigation: Users can easily navigate back to the home screen or previous pages using buttons on each screen.
- Contextual Navigation: For example, the food search result page has direct links to the food details, and the details page has options to view the nutritional breakdown or return to search results.

#### Design Choices:

- Minimalist Home Page: The home page is kept simple, reducing distractions and emphasizing the search functionality, which is central to the application.
- Visual Clarity for Breakdown: The use of pie charts and bar graphs in the Nutritional Breakdown section makes it easy for users to interpret nutritional data quickly, which is especially important for a data-heavy application.
- Filter Options for Precision: The Range and Level Filter pages allow users to quickly find foods that match specific dietary needs, making the application highly practical for health-conscious users.
- Settings Customization: Including options for theme, unit preferences, and language ensures accessibility for a wide range of users.

This structure was chosen to prioritize ease of use while allowing flexibility for more advanced features like filtering and data visualization. By keeping the navigation straightforward and ensuring each screen has a clear purpose, users can quickly access the tools they need without feeling overwhelmed.

### 4.2 Visual Design

The visual design for this application follows a simple, minimalist layout to ensure clarity and ease of use, while providing users with access to key functionalities such as searching, filtering, and visualizing nutritional data.

#### Wireframes and Interface Components

Here is a breakdown of the interface components for the main screens in the application:

1. Home Page Wireframe

- Title: "Nutritional Food Database" (Centered to the left at the top of the page).
- Search Bar: Centered in the middle of the screen, allowing users to enter the name of a food item.
- Filter Search Options Button: Directly below the search bar, allowing users to access advanced filter options.
  - Navigation Menu: On the top right of the screen, featuring:
  - Home Button
  - Range Filter Button
  - Level Filter Button
  - Settings Button
    Justification:
- Minimalist Layout: Reduces cognitive load on the user, focusing on the key feature—searching for food items. The search bar is central and prominent to encourage user interaction.
- Clear Navigation: The navigation bar contains simple icons and labels for easy access to settings and filter options.

2. Search Results Page Wireframe

- Search Bar: At the top of the page, so users can refine their search without navigating back to the home page.
- Search Results List: Below the search bar, listing food items that match the search query.
- Filter Options Button: Below the search results, providing users an option to refine their search results using filters.
  Justification:
- Consistent Search Positioning: Keeping the search bar at the top allows users to easily refine their queries, improving usability.
- Filter Access: Placing filter options right after the search results encourages users to explore advanced search functionalities, while still keeping things simple and intuitive.

3. Food Details Page Wireframe

- Food Name: Displayed prominently at the top.
- Nutritional Information: A table or list displaying all nutritional details (calories, fats, proteins, etc.).
- Nutritional Breakdown Button: A button below the table allowing users to access the graphical breakdown of the nutritional data.
- Back Button: At the bottom or top right of the screen, allowing users to return to the search results.
  Justification:
- Prominent Data Display: The focus is on presenting nutritional data in a clear and structured way, ensuring users can easily scan and absorb the details.
- Breakdown Access: Providing an option to view a visual breakdown enhances the user experience, as users can choose how to interpret the data.

4. Nutritional Breakdown Page Wireframe

- Food Name: Displayed at the top.
- Pie Chart: Visualizing the breakdown of macronutrients (proteins, carbs, fats).
- Bar Graph: Displaying micronutrient information (vitamins, minerals, etc.).
- Back Button: Positioned at the bottom of the screen to return to the details page.
  Justification:
- Data Visualization: Using both pie charts and bar graphs helps users grasp nutritional information more intuitively. The pie chart emphasizes macronutrients, while the bar graph covers vitamins and minerals.
- Back Navigation: Ensures users can easily return to the previous page without confusion.

5. Range Filter Page Wireframe

- Title: "Filter by Nutrition Range" at the top.
- Nutrient Dropdown: A dropdown menu where users can select a nutrient (e.g., Protein, Carbs, Fats).
- Min/Max Input Fields: Input fields where users can enter the minimum and maximum values for the selected nutrient.
- Apply Filter Button: At the bottom, to apply the filter and view the results.
- Back Button: Located at the bottom or top to return to the home page.
  Justification:
- Simple Filter Interface: A dropdown and input fields make it easy for users to specify their desired nutrient range without overwhelming them.
- Clear Labeling: Clearly labeled fields and buttons guide the user through the process of filtering the food list.

6. Level Filter Page Wireframe

- Title: "Filter by Nutrition Level" at the top.
- Nutrient Dropdown: Similar to the range filter, allowing users to select a nutrient.
- Level Options: Radio buttons for Low, Mid, or High level for the selected nutrient.
- Apply Filter Button: At the bottom of the screen.
- Back Button: At the top or bottom to return to the home page.
  Justification:
- Quick Selection: Radio buttons allow for a fast and simple selection process, making it user-friendly for those looking to filter based on general nutrient levels.
- Clear Labels: Using clear terms (Low, Mid, High) ensures that users can understand the filter criteria without needing additional explanation.

7. Settings Page Wireframe

- Title: "Settings" at the top.
- Theme Toggle: A switch or button to toggle between light and dark themes.
- Unit of Measure Dropdown: A dropdown menu to switch between imperial and metric units.
- Language Dropdown: A dropdown to switch between different languages.
- Save Settings Button: At the bottom of the screen, to save any changes.
- Back Button: At the top or bottom of the screen.
  Justification:
- Customization: Giving users control over theme, units, and language improves the accessibility of the application.
- Save Confirmation: Including a save button ensures users can confirm and apply their changes.

8. Food Calorie Calculator

- Search bar: Lets user type in a food item
- Search button: Lets user search for the food item that they typed in the search bar.
- Searched food List Box: Shows list of relevant items to the searched food item.
- Add to calculator Button: Adds selected food item to the calculator list box
- Calculator List box: Shows the selected food items to be calculated
- Calculate total calories button: Calculates the total calories from the selected food items and displays it.
  Justification:
- Simple and intuitive layout which makes the calculator tool easy to use.

#### General Justifications for Design Choices

- Simplicity: The design of the application is kept simple and intuitive, ensuring that both novice and experienced users can easily navigate and use the features.
- Consistency: Consistent placement of the search bar, back button, and navigation menu across all screens ensures a seamless user experience.
- Emphasis on Data: Nutritional data is presented clearly, with an option for visual representation (pie charts and bar graphs) for users who prefer to understand data graphically.
- Responsive Layout: The wireframes allow for flexibility in screen sizes, making the application adaptable to various desktop resolutions.
  By focusing on ease of use and clarity in presenting nutritional information, this design helps users quickly find and analyze the data they need while providing a smooth and intuitive user experience.

Example:  
![Visual Design](./Filter_Page.png)
![Visual Design](./Displaying_Food.png)
![Visual Design](./Home_Page.png)
![Visual Design](./Home_Page_Search_List.png)
![Visual Design](./Nutritional_Breakdown.png)
![Visual Design](./Nutritional_Level_Filter_Search_Page.png)
![Visual Design](./Nutritional_Range_Filter_Search_Page.png)
![Visual Design](./Search_Results.png)
![Visual Design](./Search_Results_Showing_Filter_Options.png)
![Visual Design](./Settings_Page.png)
