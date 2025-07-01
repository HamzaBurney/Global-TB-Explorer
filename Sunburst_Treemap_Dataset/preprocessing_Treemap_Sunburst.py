import pandas as pd
import json

data = pd.read_csv(r'E:\University\Semester 5\DAV\Project\Dataset.csv')

for year in range(2000, 2020):
    year_filtered = data[data['year'] == year]
    hierarchy = year_filtered.groupby(['region', 'subregion', 'Country']).agg({'Tuberculosis_Deaths':'sum'}).reset_index()
    hierarchical_data = {
        'name': 'Global',
        'children': []
    }

    for region, region_df in hierarchy.groupby('region'):
        region_dict = {
            'name': region,
            'children': []
        }
        for subregion, subregion_df in region_df.groupby('subregion'):
            subregion_dict = {
                'name': subregion,
                'children': [{
                    'name': row['Country'],
                    'value': row['Tuberculosis_Deaths'],
                    'year': year
                } for index, row in subregion_df.iterrows()]
            }
            region_dict['children'].append(subregion_dict)
        hierarchical_data['children'].append(region_dict)

    with open(f'{year}_data.json', 'w') as fp:
        json.dump(hierarchical_data, fp)
