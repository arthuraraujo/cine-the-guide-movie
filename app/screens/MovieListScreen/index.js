import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Asset } from 'expo-asset';
import { Feather } from '@expo/vector-icons';
import { Assets as StackAssets } from 'react-navigation-stack';

import Spinner from '../../components/common/Spinner';
import NotificationCard from '../../components/cards/NotificationCard';
import FilterModal from '../../components/modals/FilterModal';
import MovieListRow from '../../components/cards/rows/MovieListRow';
import MovieRow from '../../components/cards/rows/MovieRow';
import { TouchableOpacity } from '../../components/common/TouchableOpacity';

import request from '../../services/Api';

import { getItem } from '../../utils/AsyncStorage';

import { darkBlue } from '../../styles/Colors';

import styles from './styles';

export const MovieListScreen = ({ navigation }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hasAdultContent, setHasAdultContent] = useState(false);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    filterType: 'popularity.desc',
    filterName: 'Most popular'
  });
  const [view, setView] = useState({ numColumns: 1, keyGrid: 1 });

  useEffect(() => {
    (async () => {
      try {
        Asset.loadAsync(StackAssets);
        navigation.setParams({ actionFilter });

        const adultContentStorage = await getItem(
          '@ConfigKey',
          'hasAdultContent'
        );

        setHasAdultContent(adultContentStorage);
        requestMoviesList();
      } catch (error) {
        requestMoviesList();
      }
    })();
  }, []);

  requestMoviesList = async () => {
    try {
      setIsLoading(true);

      const { filterType } = filter;
      const dateRelease = new Date().toISOString().slice(0, 10);

      const data = await request('discover/movie', {
        page,
        'release_date.lte': dateRelease,
        sort_by: filterType,
        with_release_type: '1|2|3|4|5|6|7',
        include_adult: hasAdultContent
      });

      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefresh(false);
      setIsError(false);
      setTotalPages(data.total_pages);
      setResults(isRefresh ? data.results : [...results, ...data.results]);
    } catch (err) {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefresh(false);
      setIsError(true);
    }
  };

  renderItem = (item, type, isSearch, numColumns, navigate) => (
    <MovieRow
      item={item}
      type={type}
      isSearch={isSearch}
      numColumns={numColumns}
      navigate={navigate}
    />
  );

  renderFooter = () => {
    if (isLoadingMore) return <Spinner size="small" />;

    if (totalPages !== page && results.length > 0) {
      return (
        <View style={styles.loadingMore}>
          <TouchableOpacity
            style={styles.loadingButton}
            onPress={actionLoadMore}
          >
            <Text style={styles.loadingText}>Load more</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (results.length > 0) return <View style={styles.loadingMore} />;

    return null;
  };

  actionRefresh = async () => {
    await setIsRefresh(true);
    await setPage(1);
    await requestMoviesList();
  };

  actionLoadMore = async () => {
    await setIsLoadingMore(true);
    await setPage(page + 1);
    await requestMoviesList();
  };

  actionGrid = () => {
    const { numColumns, keyGrid } = view;

    setView({ numColumns: numColumns === 1 ? 2 : 1, keyGrid: keyGrid + 1 });
  };

  actionFilter = () => {
    setIsVisible(!isVisible);
  };

  actionSwitchMovie = async (type, name, visible) => {
    const { filterType } = filter;

    if (type !== filterType) {
      await setPage(1);
      await setResults([]);
      await setFilter({ filterType: type, filterName: name });
      await setIsVisible(visible);
      await requestMoviesList();
    } else {
      setIsVisible(visible);
    }
  };

  const { navigate } = navigation;
  const { filterName, filterType } = filter;
  const { numColumns, keyGrid } = view;

  return (
    <View style={styles.container}>
      {isLoading && !isRefresh && !isLoadingMore ? (
        <Spinner />
      ) : isError ? (
        <NotificationCard icon="alert-octagon" action={requestMoviesList} />
      ) : results.length === 0 ? (
        <NotificationCard
          icon="thumbs-down"
          textError="No results available."
        />
      ) : (
        <View style={styles.containerList}>
          {results.length > 0 && (
            <View style={styles.containerMainText}>
              <Text style={styles.textMain} numberOfLines={1}>
                {filterName}
              </Text>
              <TouchableOpacity
                style={[
                  styles.buttonGrid,
                  numColumns === 2 && styles.buttonGridActive
                ]}
                onPress={actionGrid}
              >
                <Feather name="grid" size={22} color={darkBlue} />
              </TouchableOpacity>
            </View>
          )}
          <MovieListRow
            data={results}
            type="normal"
            isSearch={false}
            keyGrid={keyGrid}
            numColumns={numColumns}
            refreshing={isRefresh}
            onRefresh={actionRefresh}
            ListFooterComponent={renderFooter}
            navigate={navigate}
            renderItem={renderItem}
          />
        </View>
      )}
      <FilterModal
        isVisible={isVisible}
        filterType={filterType}
        filterName={filterName}
        actionFilter={actionFilter}
        actionSwitchMovie={actionSwitchMovie}
        style={styles.bottomModal}
      />
    </View>
  );
};

MovieListScreen.navigationOptions = ({ navigation }) => {
  const params = navigation.state.params || {};

  return {
    headerRight: (
      <TouchableOpacity
        style={styles.buttonFilter}
        onPress={params.actionFilter}
      >
        <Feather name="filter" size={23} color={darkBlue} />
      </TouchableOpacity>
    )
  };
};

export default MovieListScreen;
