# MMEIC Storytellers Stradbroke Visualization Dashboard

This interactive dashboard presents an analysis of stories and themes collected from Quandamooka storytellers on Stradbroke Island (Minjerribah) as part of the MMEIC School Holiday Program.

## Features

- **Thematic Analysis**: Visualizes the most common themes from storytellers' narratives
- **Sentiment Analysis**: Displays sentiment patterns and strength across different themes
- **Quote Showcase**: Highlights meaningful quotes from community members
- **Word Cloud**: Represents key terms and concepts sized by frequency in narratives

## Project Structure

The project is built with React and uses several key libraries:

- **React**: Frontend framework
- **Recharts**: For creating responsive charts
- **PapaParse**: For parsing CSV data
- **Lodash**: For data manipulation
- **TailwindCSS**: For styling

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine

### Installation

1. Clone the repository:
   ```
   git clone [repository URL]
   cd mmeic-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard in your browser.

## Data Source

The visualizations are based on data collected from storytellers with proper consent and respect for cultural protocols. The data is stored in a CSV file (`StorytellersStradbroke.csv`) in the `public` directory.

## Cultural Considerations

This project has been developed with respect for:

- Cultural protocols around storytelling
- Knowledge sovereignty
- Indigenous data sovereignty principles
- Proper attribution and consent

## Customization

To modify the dashboard:

1. **Data**: Replace the CSV file in the `public` directory
2. **Themes**: Modify color schemes in `tailwind.config.js`
3. **Components**: Edit individual visualization components in the `src/components` directory

## Deployment

Build the application for production:

```
npm run build
```

The build folder will contain the optimized production build ready for deployment.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- MMEIC (Minjerribah Moorgumpin Elders-in-Council)
- Quandamooka storytellers who shared their knowledge
- The traditional owners and custodians of Minjerribah (Stradbroke Island)
